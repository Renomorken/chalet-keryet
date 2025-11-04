
import Stripe from 'stripe';
export default async function handler(req, res){
  if(req.method!=='POST'){ res.status(405).json({error:'Method not allowed'}); return; }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { start, end, guests, name, email, nightly, cleaning } = req.body;
  const nights = Math.max(1, Math.round((new Date(end)-new Date(start))/(1000*60*60*24)));
  const amount = nights*nightly + cleaning;
  try{
    const session = await stripe.checkout.sessions.create({
      mode:'payment',
      payment_method_types:['card'],
      customer_email: email,
      client_reference_id: `${start}_${end}_${guests}`,
      allow_promotion_codes: true,
      line_items:[{ price_data:{ currency:'eur', product_data:{ name:`Location chalet — ${nights} nuit(s)` }, unit_amount: Math.round(amount*100) }, quantity:1 }],
      metadata:{ start, end, guests, name },
      success_url: process.env.SUCCESS_URL || 'https://example.com/success',
      cancel_url: process.env.CANCEL_URL || 'https://example.com/cancel'
    });
    res.status(200).json({url: session.url});
  }catch(e){ console.error(e); res.status(500).json({error:'stripe_error'}); }
}
