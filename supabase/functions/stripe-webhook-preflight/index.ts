// PureHome Stripe webhook preflight endpoint.
// This endpoint is intentionally READ-ONLY and DISABLED until the private
// payment tables, atomic event processing, and Stripe test integration exist.
// It NEVER acknowledges a verified payment as processed.
import {verifyStripeSignature} from '../../../src/stripe-webhook-signature.js';
import {parseCheckoutPaymentEvent} from '../../../src/stripe-checkout-event.js';

const json=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{
 status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
});

Deno.serve(async(request:Request)=>{
 if(request.method!=='POST')return json(405,{error:'Method not allowed'});
 if(Deno.env.get('PUREHOME_ENABLE_STRIPE_WEBHOOK_PREFLIGHT')!=='true')
  return json(503,{error:'Payment integration is not enabled'});
 const secret=Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST');
 if(!secret?.startsWith('whsec_'))return json(503,{error:'Stripe test webhook is not configured'});
 const signatureHeader=request.headers.get('stripe-signature')??'';
 const contentLength=Number(request.headers.get('content-length')??'0');
 if(!Number.isFinite(contentLength)||contentLength>65536)return json(413,{error:'Payload too large'});
 let rawBody:string;
 try{
  const body=await request.arrayBuffer();
  if(body.byteLength>65536)return json(413,{error:'Payload too large'});
  rawBody=new TextDecoder('utf-8',{fatal:true}).decode(body);
 }catch{return json(400,{error:'Invalid request body'});}
 const valid=await verifyStripeSignature({rawBody,signatureHeader,webhookSecret:secret});
 if(!valid)return json(400,{error:'Invalid webhook signature'});
 let event:unknown;
 try{event=JSON.parse(rawBody);}catch{return json(400,{error:'Invalid JSON'});}
 const parsed=parseCheckoutPaymentEvent(event);
 if(!parsed.ok)return json(400,{error:'Unsupported or invalid checkout event'});
 if(!parsed.sessionId.startsWith('cs_test_'))return json(400,{error:'Only Stripe test sessions are permitted'});
 // Do not return 2xx: Stripe must retry events until the actual atomic
 // processing handler is installed. This function performs NO writes.
 return json(503,{error:'Verified test event; processing not configured'});
});
