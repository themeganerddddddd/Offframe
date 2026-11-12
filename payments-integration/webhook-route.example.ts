// Example Next.js app/api/stripe-webhook/route.ts — reference only.
// Register in the Stripe Dashboard and set the webhook signing secret.
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request:NextRequest){
 const signature=request.headers.get('stripe-signature');
 if(!signature)return new Response('Missing Stripe signature',{status:400});
 let event: Stripe.Event;
 try { event=stripe.webhooks.constructEvent(await request.text(),signature,
   process.env.STRIPE_WEBHOOK_SECRET!); }
 catch { return new Response('Bad signature',{status:400}); }
 try {
  if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
   const session=event.data.object as Stripe.Checkout.Session;
   if(session.payment_status!=='paid')return NextResponse.json({received:true});
   const orderId=session.metadata?.offframe_order_id;
   const intent=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id;
   if(!orderId||!intent)throw new Error('Missing order metadata or payment intent');
   const result=await db.rpc('offframe_confirm_paid_checkout',{
     p_order_id:orderId,p_session_id:session.id,p_payment_intent_id:intent
   });
   if(result.error)throw result.error;
  }
  if(event.type==='checkout.session.expired'||event.type==='checkout.session.async_payment_failed'){
   const session=event.data.object as Stripe.Checkout.Session;
   if(session.metadata?.offframe_order_id){
    const result=await db.rpc('offframe_release_checkout',{
     p_order_id:session.metadata.offframe_order_id,
     p_status:event.type==='checkout.session.expired'?'expired':'failed'
    });
    if(result.error)throw result.error;
   }
  }
  if(event.type==='charge.refunded'){
   const charge=event.data.object as Stripe.Charge;
   const intent=typeof charge.payment_intent==='string'?charge.payment_intent:charge.payment_intent?.id;
   if(intent){const result=await db.rpc('offframe_refund_checkout',{
    p_payment_intent_id:intent
   });if(result.error)throw result.error;}
  }
  return NextResponse.json({received:true});
 } catch {
  // Return non-2xx on transient database errors so Stripe can retry. Add alerting.
  return new Response('Webhook processing error',{status:500});
 }
}
