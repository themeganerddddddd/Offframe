# Turning Offframe's Buy Art preview into real payments

**Status: engineering starter, not an activated payment system.** The V4 website can *simulate* a purchase and show the associated local market row. No card data or money is processed in the preview. A real launch requires hosting, secure accounts, seller onboarding, connected payouts, real owned artwork and a database. None of those credentials exist in this download.

## Intended stack

- Next.js server-side checkout endpoint (example in `checkout-route.example.ts`).
- Supabase Postgres for listings, holds, orders and real price records (`schema.sql`).
- Stripe Connect to onboard a verified artist seller and route payout net of the agreed platform fee.
- Stripe-hosted Checkout to collect the customer's card details and shipping address.
- Stripe signed webhooks (example in `webhook-route.example.ts`) to confirm **paid** sessions and write sale data.
- A public Market tab derived *only* from successful server-confirmed, non-refunded sales. Do not insert a browser click into real market history.

## One purchase lifecycle

1. Artist verifies their identity and right to sell a work, connects a payout account and sets a USD price and US shipping policy.
2. Buyer clicks **Buy artwork**. Frontend submits only an opaque `listingId` to your authenticated/rate-limited `/api/checkout` endpoint.
3. Database atomically reserves this unique listing for 30 minutes; server re-reads the price and validates seller payout readiness.
4. Server creates a Stripe Checkout Session with the seller's connected account, a defined Offframe fee and an explicit shipping option (if priced). The buyer pays on Stripe's page, not in Offframe's static code.
5. Stripe sends a signed payment event to your webhook. A transaction function marks the reserved artwork sold and writes a verified market price row. Duplicate webhook events are idempotent. A conflicting hold goes into `needs_review` instead of becoming a false sale.
6. If checkout expires, the hold is released. Refunds remove the sale from active verified price history. Artwork is *not* automatically relisted after a refund.
7. Artist gets a fulfillment dashboard; customer gets confirmation and seller shipping/tracking status. Make the real Market tab filter for `status = 'paid'`.

## Before enabling real money

- Link artwork and artist IDs to real authenticated profiles. The illustrative artwork in the design preview is **not** for sale.
- Add server-side ownership checks and Row Level Security for all seller editing.
- Complete Stripe Connect onboarding, seller verification, payment-method requirements, dispute handling, prohibited-item rules and applicable tax responsibilities.
- Specify real shipping prices/regions, returns, authenticity claims, loss-in-transit procedures, invoices, privacy and refund policies. Add fulfillment/tracking and support workflows.
- Audit hold expiration, cancellation, webhook retries, partial refunds and payment reversals. The reference code intentionally lacks rate limiting, monitoring, session ownership, shipping fulfillment, tax configuration, and buyer notification.
- Use Stripe **test mode** with webhooks, retry tests and simulated concurrent buyers before any live charges. Obtain security and legal review.
- Provide commission requests via mailto (the prototype supports this after artists enter an email). Later replace with a spam-protected server inquiry form and inbox workflow, if desired.

> Important: `checkout-route.example.ts` and `webhook-route.example.ts` are reference code, not complete deployable endpoints. They require migration, real listing records, connection to the hosted Next.js app, rate limiting, and environment variables. The production UI should query the server for listing availability and market history.

Stripe documentation: https://docs.stripe.com/connect and https://docs.stripe.com/payments/checkout/fulfill-orders
