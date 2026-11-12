-- Offframe payment data model: PRODUCTION STARTER, not a deployed migration.
-- Apply after implementing Supabase Auth, artwork ownership, moderator/rights review,
-- seller onboarding, tax/shipping rules, and data access permissions.
-- Run only as a privileged migration, not from an untrusted browser.
create extension if not exists pgcrypto;

create table if not exists public.offframe_seller_accounts (
  artist_profile_id uuid primary key,
  owner_user_id uuid not null references auth.users(id),
  stripe_account_id text not null unique,
  charges_enabled boolean not null default false,
  rights_reviewed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.offframe_market_listings (
  id uuid primary key default gen_random_uuid(),
  artist_profile_id uuid not null references public.offframe_seller_accounts(artist_profile_id),
  artwork_id uuid not null unique,
  title text not null,
  artwork_image_url text,
  currency text not null default 'usd' check(currency = 'usd'),
  price_cents integer not null check(price_cents between 100 and 99999999),
  shipping_cents integer not null default 0 check(shipping_cents between 0 and 1000000),
  status text not null default 'available' check(status in ('available','held','sold','hidden')),
  held_order_id uuid,
  hold_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.offframe_market_orders (
  id uuid primary key,
  listing_id uuid not null references public.offframe_market_listings(id),
  artist_profile_id uuid not null,
  artwork_id uuid not null,
  price_cents integer not null,
  shipping_cents integer not null,
  currency text not null default 'usd',
  platform_fee_cents integer not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  status text not null default 'pending' check(status in ('pending','paid','expired','failed','refunded','needs_review')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.offframe_price_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.offframe_market_orders(id),
  listing_id uuid not null,
  artist_profile_id uuid not null,
  artwork_id uuid not null,
  sale_price_cents integer not null,
  currency text not null,
  source text not null default 'offframe_checkout' check(source='offframe_checkout'),
  status text not null default 'paid' check(status in ('paid','refunded')),
  verified_at timestamptz not null default now()
);

create index if not exists off_market_prices_artist_idx
  on public.offframe_price_records(artist_profile_id,verified_at desc)
  where status='paid';
create index if not exists off_market_hold_idx
  on public.offframe_market_listings(status,hold_expires_at);

-- Reserve one unique physical work for 30 minutes, ensuring only one live buyer
-- can open a checkout session. Must be invoked using the server's service role.
create or replace function public.offframe_reserve_checkout(p_listing_id uuid,p_order_id uuid)
returns table(order_id uuid,listing_id uuid,artist_profile_id uuid,artwork_id uuid,
 price_cents integer,shipping_cents integer,currency text,title text,
 stripe_account_id text) language plpgsql security definer
set search_path = public as $$
declare
 l public.offframe_market_listings%rowtype;
 seller public.offframe_seller_accounts%rowtype;
 fee integer;
begin
  update public.offframe_market_listings m
    set status='held', held_order_id=p_order_id,
        hold_expires_at=now()+interval '30 minutes'
   where m.id=p_listing_id and (
        m.status='available' or (m.status='held' and m.hold_expires_at<now()))
  returning m.* into l;
  if not found then raise exception 'Artwork is unavailable'; end if;
  select * into seller from public.offframe_seller_accounts s
   where s.artist_profile_id=l.artist_profile_id and s.charges_enabled
   and s.rights_reviewed;
  if not found then
   update public.offframe_market_listings set status='available',held_order_id=null,
   hold_expires_at=null where id=p_listing_id and held_order_id=p_order_id;
   raise exception 'Seller onboarding or artwork rights review not complete';
  end if;
  fee := round(l.price_cents*.10)::integer; -- example fee, change as required
  insert into public.offframe_market_orders(id,listing_id,artist_profile_id,artwork_id,
    price_cents,shipping_cents,currency,platform_fee_cents)
    values(p_order_id,l.id,l.artist_profile_id,l.artwork_id,
    l.price_cents,l.shipping_cents,l.currency,fee);
  return query select p_order_id,l.id,l.artist_profile_id,l.artwork_id,
    l.price_cents,l.shipping_cents,l.currency,l.title,seller.stripe_account_id;
end; $$;

create or replace function public.offframe_set_checkout_session(p_order_id uuid,p_session_id text)
returns void language plpgsql security definer
set search_path=public as $$
begin
 update public.offframe_market_orders
  set stripe_checkout_session_id=p_session_id
  where id=p_order_id and status='pending' and stripe_checkout_session_id is null;
 if not found then raise exception 'Checkout order is unavailable'; end if;
end; $$;

create or replace function public.offframe_release_checkout(p_order_id uuid,p_status text default 'expired')
returns void language plpgsql security definer
set search_path=public as $$
declare o public.offframe_market_orders%rowtype;
begin
 if p_status not in ('expired','failed') then raise exception 'Bad release status'; end if;
 select * into o from public.offframe_market_orders where id=p_order_id for update;
 if not found or o.status <> 'pending' then return; end if;
 update public.offframe_market_orders set status=p_status where id=p_order_id;
 update public.offframe_market_listings set status='available',held_order_id=null,hold_expires_at=null
  where id=o.listing_id and held_order_id=p_order_id and status='held';
end; $$;

-- Called only AFTER Stripe signs a paid Checkout event. Idempotent for retries.
-- A stale or conflicting hold becomes needs_review; a human must decide refund.
create or replace function public.offframe_confirm_paid_checkout(
 p_order_id uuid,p_session_id text,p_payment_intent_id text)
returns void language plpgsql security definer
set search_path=public as $$
declare o public.offframe_market_orders%rowtype;
begin
 select * into o from public.offframe_market_orders where id=p_order_id for update;
 if not found then raise exception 'Unknown order'; end if;
 if o.status='paid' then return; end if;
 if o.status<>'pending' or o.stripe_checkout_session_id<>p_session_id then
    raise exception 'Order or session mismatch'; end if;
 update public.offframe_market_listings set status='sold', held_order_id=null,hold_expires_at=null
  where id=o.listing_id and status='held' and held_order_id=o.id;
 if not found then
   update public.offframe_market_orders set status='needs_review',
    stripe_payment_intent_id=p_payment_intent_id where id=o.id;
   return;
 end if;
 update public.offframe_market_orders set status='paid',paid_at=now(),
  stripe_payment_intent_id=p_payment_intent_id where id=o.id;
 insert into public.offframe_price_records(order_id,listing_id,artist_profile_id,
  artwork_id,sale_price_cents,currency)
 values(o.id,o.listing_id,o.artist_profile_id,o.artwork_id,o.price_cents,o.currency)
 on conflict (order_id) do nothing;
end; $$;

create or replace function public.offframe_refund_checkout(p_payment_intent_id text)
returns void language plpgsql security definer
set search_path=public as $$
declare o public.offframe_market_orders%rowtype;
begin
 select * into o from public.offframe_market_orders
  where stripe_payment_intent_id=p_payment_intent_id for update;
 if not found then return; end if;
 update public.offframe_market_orders set status='refunded' where id=o.id and status='paid';
 update public.offframe_price_records set status='refunded' where order_id=o.id;
 -- Inventory must NOT automatically go live: a refunded physical piece may
 -- still be in transit, damaged, or subject to a return inspection.
end; $$;

-- Sensitive seller, order and price tables are not directly accessible to
-- anonymous clients. Use only signed server routes and vetted public views.
alter table public.offframe_seller_accounts enable row level security;
alter table public.offframe_market_listings enable row level security;
alter table public.offframe_market_orders enable row level security;
alter table public.offframe_price_records enable row level security;
revoke all on public.offframe_seller_accounts,public.offframe_market_listings,
 public.offframe_market_orders,public.offframe_price_records from anon,authenticated;
revoke all on function public.offframe_reserve_checkout(uuid,uuid),
 public.offframe_set_checkout_session(uuid,text),
 public.offframe_release_checkout(uuid,text),
 public.offframe_confirm_paid_checkout(uuid,text,text),
 public.offframe_refund_checkout(text) from public,anon,authenticated;
grant execute on function public.offframe_reserve_checkout(uuid,uuid),
 public.offframe_set_checkout_session(uuid,text),
 public.offframe_release_checkout(uuid,text),
 public.offframe_confirm_paid_checkout(uuid,text,text),
 public.offframe_refund_checkout(text) to service_role;

-- Example verified-price query for the public Market tab, executed server-side:
-- SELECT artwork_id, sale_price_cents, currency, verified_at
-- FROM public.offframe_price_records
-- WHERE artist_profile_id=:artist_id AND status='paid'
-- ORDER BY verified_at DESC;
