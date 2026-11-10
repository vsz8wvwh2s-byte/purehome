// Advisory checklist only. Never infer deposit payment from a manually accepted quote.
// Booking confirmation requires a server-verified payment event and owner-approved slot.
export function validPreferredDate(value, today=new Date().toISOString().slice(0,10)) {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<today)return false;
 const [year,month,day]=value.split('-').map(Number);
 const date=new Date(Date.UTC(year,month-1,day));
 return date.getUTCFullYear()===year&&date.getUTCMonth()+1===month&&date.getUTCDate()===day;
}
export function bookingReadiness({status,quotedAmount,preferredDate,depositVerified=false,availabilityConfirmed=false}) {
 const quoteAccepted=status==='accepted';
 const validPrice=typeof quotedAmount==='number'&&Number.isFinite(quotedAmount)&&quotedAmount>=1&&quotedAmount<=100000&&Math.abs(Math.round(quotedAmount*100)-quotedAmount*100)<0.000001;
 const hasPreferredDate=validPreferredDate(preferredDate);
 const steps=[
  {key:'quote',label:'Customer accepted the saved quote',done:quoteAccepted},
  {key:'price',label:'Valid personalized quote price',done:validPrice},
  {key:'date',label:'Preferred date supplied (not reserved)',done:hasPreferredDate},
  {key:'deposit',label:'30% deposit verified by payment backend',done:depositVerified===true},
  {key:'availability',label:'Cleaning time confirmed by owner',done:availabilityConfirmed===true}
 ];
 return {steps,readyToConfirm:steps.every(step=>step.done)};
}
