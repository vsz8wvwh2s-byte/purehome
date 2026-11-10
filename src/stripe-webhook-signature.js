// Stripe signs the exact raw request body: t=timestamp,v1=HMAC_SHA256(timestamp.body).
// No Stripe event may be trusted until this verification succeeds.
const encoder=new TextEncoder();
function hex(bytes){return [...bytes].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
function safeEqualHex(a,b){
 if(!/^[0-9a-f]{64}$/i.test(a)||!/^[0-9a-f]{64}$/i.test(b))return false;
 let difference=0;
 for(let i=0;i<64;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);
 return difference===0;
}
export async function verifyStripeSignature({rawBody,signatureHeader,webhookSecret,nowSeconds=Math.floor(Date.now()/1000),toleranceSeconds=300}){
 if(typeof rawBody!=='string'||typeof signatureHeader!=='string'||typeof webhookSecret!=='string'||!webhookSecret.startsWith('whsec_'))return false;
 if(!Number.isSafeInteger(nowSeconds)||!Number.isSafeInteger(toleranceSeconds)||toleranceSeconds<0)return false;
 const fields=signatureHeader.split(',').map(field=>field.trim());
 const timestamps=fields.filter(field=>field.startsWith('t=')).map(field=>field.slice(2));
 const signatures=fields.filter(field=>field.startsWith('v1=')).map(field=>field.slice(3));
 if(timestamps.length!==1||signatures.length===0||signatures.length>20||!/^[0-9]{1,16}$/.test(timestamps[0]))return false;
 const timestamp=Number(timestamps[0]);
 if(!Number.isSafeInteger(timestamp)||Math.abs(nowSeconds-timestamp)>toleranceSeconds)return false;
 const key=await crypto.subtle.importKey('raw',encoder.encode(webhookSecret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const mac=hex(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(`${timestamps[0]}.${rawBody}`))));
 return signatures.some(signature=>safeEqualHex(mac,signature.toLowerCase()));
}
