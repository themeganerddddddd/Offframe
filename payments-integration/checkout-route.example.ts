// Example Next.js app/api/checkout/route.ts (requires adaptation to your real app).
// Requires stripe and @supabase/supabase-js; all secrets MUST stay on the server.
// This is a reference implementation, not a deployed endpoint.
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const allowedOrigin = process.env.PUBLIC_SITE_URL!;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
 let orderId = '';
 try {
  // Add a verified user/session or guest checkout policy + rate limiting here.
  const { listingId } = await request.json();
  if(typeof listingId!=='string'||!uuid.test(listingId))
   return NextResponse.json({error:'Invalid listing ID'},{status:400});
  orderId=crypto.randomUUID();
  const reservation = await db.rpc('offframe_reserve_checkout', {
   p_listing_id:listingId, p_order_id:orderId
  }).single();
  if(reservation.error || !reservation.data)
   return NextResponse.json({error:'Artwork unavailable or seller not ready'},{status:409});
  const r = reservation.data;
  const account = await stripe.accounts.retrieve(r.stripe_account_id);
  if(!account.charges_enabled)throw new Error('Seller account cannot accept charges');
  const base = new URL(allowedOrigin);
  // Allowed countries, shipping cost and tax policy must be reviewed by region.
  const session = await stripe.checkout.sessions.create({
   mode:'payment', payment_method_types:['card'],
   client_reference_id:orderId, expires_at:Math.floor(Date.now()/1000)+30*60,
   line_items:[{price_data:{currency:'usd',unit_amount:r.price_cents,
    product_data:{name:r.title}},quantity:1}],
   shipping_address_collection:{allowed_countries:['US']},
   ...(r.shipping_cents>0 ? {shipping_options:[{shipping_rate_data:{type:'fixed_amount',
    fixed_amount:{amount:r.shipping_cents,currency:'usd'},display_name:'Artist shipping'}}]} : {}),
   payment_intent_data:{application_fee_amount:Math.round(r.price_cents*0.10),
    transfer_data:{destination:r.stripe_account_id},
    metadata:{offframe_order_id:orderId}},
   metadata:{offframe_order_id:orderId,offframe_listing_id:listingId},
   success_url:new URL('/checkout/success?session_id={CHECKOUT_SESSION_ID}',base).toString(),
   cancel_url:new URL('/checkout/cancelled',base).toString()
  });
  if(!session.url)throw new Error('Missing checkout URL');
  const recorded = await db.rpc('offframe_set_checkout_session', {
   p_order_id:orderId,p_session_id:session.id
  });
  if(recorded.error)throw recorded.error;
  return NextResponse.json({url:session.url});
 } catch(e) {
  if(orderId)await db.rpc('offframe_release_checkout',{
   p_order_id:orderId,p_status:'failed'
  });
  return NextResponse.json({error:'Could not start checkout'},{status:500});
 }
}
