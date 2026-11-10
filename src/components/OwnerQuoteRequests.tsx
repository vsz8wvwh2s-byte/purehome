import {splitCleaningPayment,quoteDollarsToCents} from '../payment-split.js';
import {useEffect,useRef,useState} from 'react';
import {supabase} from '../supabase';
type RequestRow={services:{name:string}|null;id:string;customer_name:string;customer_email:string;customer_phone:string;address:string;description:string;preferred_date:string|null;status:string;quoted_amount:number|null;created_at:string};
export default function OwnerQuoteRequests(){
 const [ageFilter,setAgeFilter]=useState<'all'|'7'|'14'|'30'>('all');
 const [savingId,setSavingId]=useState<string|null>(null),[saveMessages,setSaveMessages]=useState<Record<string,string>>({}),[draftAmounts,setDraftAmounts]=useState<Record<string,string>>({}),[rows,setRows]=useState<RequestRow[]>([]),[page,setPage]=useState(0),[hasMore,setHasMore]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true),[filter,setFilter]=useState('all'),[priceFilter,setPriceFilter]=useState('all'),[serviceFilter,setServiceFilter]=useState('all'),[search,setSearch]=useState(''),[sort,setSort]=useState<'newest'|'oldest'>('newest'),[expanded,setExpanded]=useState<string[]>([]);
 const latestLoad=useRef(0);
 const now=Date.now();
 const normalizedSearch=search.trim().toLowerCase();
 const visible=rows.filter(r=>(ageFilter==='all'||(r.status==='quoted'&&Number.isFinite(Date.parse(r.created_at))&&now-Date.parse(r.created_at)>=Number(ageFilter)*86400000))&&(filter==='all'||(filter==='needs_attention'?(['pending','new','reviewing'].includes(r.status)&&r.quoted_amount==null):r.status===filter))&&(priceFilter==='all'||(priceFilter==='unpriced'?r.quoted_amount==null:r.quoted_amount!=null))&&(serviceFilter==='all'||r.services?.name===serviceFilter)&&[r.customer_name,r.customer_email,r.address,r.description].some(value=>String(value??'').toLowerCase().includes(normalizedSearch))).sort((a,b)=>sort==='newest'?Date.parse(b.created_at)-Date.parse(a.created_at):Date.parse(a.created_at)-Date.parse(b.created_at));
 const statuses=Array.from(new Set(rows.map(r=>r.status)));
 const statusLabel=(status:string)=>({pending:'Pending review',new:'New',reviewing:'Under review',quoted:'Quoted',accepted:'Accepted',declined:'Declined',closed:'Closed'} as Record<string,string>)[status]??status;
 const serviceNames=Array.from(new Set(rows.map(r=>r.services?.name).filter((name):name is string=>Boolean(name))));
 const pendingCount=rows.filter(r=>r.status==='pending'||r.status==='new'||r.status==='reviewing').length;
 const needsAttention=rows.filter(r=>['pending','new','reviewing'].includes(r.status)&&r.quoted_amount==null).length;
 const showNeedsAttention=()=>{setFilter('needs_attention');setServiceFilter('all');setPriceFilter('unpriced');setSearch('');setSort('oldest');};
 const quotedCount=rows.filter(r=>r.status==='quoted').length;
 const acceptedCount=rows.filter(r=>r.status==='accepted').length;
 const showAccepted=()=>{setFilter('accepted');setAgeFilter('all');setPriceFilter('all');setServiceFilter('all');setSearch('');setSort('newest');};
 const reviewingCount=rows.filter(r=>r.status==='reviewing').length;
 const showAwaitingReply=()=>{setFilter('quoted');setAgeFilter('all');setPriceFilter('all');setServiceFilter('all');setSearch('');setSort('oldest');};
 const showOlderQuotes=()=>{setFilter('quoted');setAgeFilter('7');setPriceFilter('all');setServiceFilter('all');setSearch('');setSort('oldest');};
 const olderQuoteCount=rows.filter(r=>r.status==='quoted'&&Number.isFinite(Date.parse(r.created_at))&&Date.now()-Date.parse(r.created_at)>=7*86400000).length;
 const pricedCount=rows.filter(r=>r.quoted_amount!=null).length;
 const unpricedCount=rows.filter(r=>r.quoted_amount==null).length;
 const currency=(amount:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(amount);
 const paymentParts=(amount:number)=>splitCleaningPayment(quoteDollarsToCents(amount));
 const dollars=(cents:number)=>currency(cents/100);
 const quoteEmail=(r:RequestRow)=>`Hello ${r.customer_name},

Thank you for requesting ${r.services?.name??'cleaning'} with PureHome.

After reviewing your request, my proposed cleaning price is ${currency(r.quoted_amount!)}.\n\nPayment schedule: 30% deposit (${dollars(paymentParts(r.quoted_amount!).depositCents)}) before the cleaning and the remaining 70% (${dollars(paymentParts(r.quoted_amount!).balanceCents)}) after the job is completed.

This is a personalized quote only. Your preferred date is not reserved, and no payment has been collected. The deposit and final balance must be paid through secure payment links when available; do not send card details by email. Please reply to this email to discuss or accept the quote. I will confirm the next steps before scheduling your cleaning.

Thank you,
PureHome`;
 const followUpEmail=(r:RequestRow)=>`Hello ${r.customer_name},

I'm following up on your PureHome ${r.services?.name??'cleaning'} quote of ${currency(r.quoted_amount!)} (30% deposit ${dollars(paymentParts(r.quoted_amount!).depositCents)}, 70% after cleaning ${dollars(paymentParts(r.quoted_amount!).balanceCents)}).

If you would like to proceed, please reply to this email so we can discuss availability and the next steps. Your preferred cleaning date is not reserved. This message is not a payment request, and no appointment has been confirmed.

If you have questions or need to adjust the cleaning details, please let me know.

Thank you,
PureHome`;
 const acceptanceStepsEmail=(r:RequestRow)=>`Hello ${r.customer_name},

Thank you for your interest in moving forward with PureHome ${r.services?.name??'cleaning'}.

Your personalized quote is ${currency(r.quoted_amount!)}. Once you confirm you accept this quote, the payment schedule will be a 30% deposit (${dollars(paymentParts(r.quoted_amount!).depositCents)}) before the appointment is confirmed and the remaining 70% (${dollars(paymentParts(r.quoted_amount!).balanceCents)}) after the cleaning is completed.

Please reply to confirm that you accept the quote and let me know whether your preferred date (${r.preferred_date??'to be arranged'}) still works for you. I will review availability and confirm the next steps personally.

Your appointment is not booked yet. This email is not a payment request; no payment link has been created and you should never send card information by email.

Thank you,
PureHome`;
 async function copyAcceptanceSteps(r:RequestRow){
  if(r.status!=='quoted'||r.quoted_amount==null||!Number.isFinite(r.quoted_amount)||r.quoted_amount<1||r.quoted_amount>100000)return;
  try{
   await navigator.clipboard.writeText(acceptanceStepsEmail(r));
   setSaveMessages(previous=>({...previous,[r.id]:'Acceptance instructions copied. Review and send manually; no quote was accepted, payment collected, or booking confirmed.'}));
  }catch{
   setSaveMessages(previous=>({...previous,[r.id]:'Could not copy acceptance instructions. Use Prepare acceptance email instead.'}));
  }
 }
 const paymentSchedule=(r:RequestRow)=>{const amount=r.quoted_amount;if(amount==null)return '';const parts=paymentParts(amount);return `PureHome cleaning quote for ${r.customer_name}\nTotal: ${currency(amount)}\n30% deposit due after quote acceptance: ${dollars(parts.depositCents)}\n70% balance due after completed cleaning: ${dollars(parts.balanceCents)}\nNo payment has been requested or collected by this message. Appointment subject to owner confirmation.`;};
 async function copyPaymentSchedule(r:RequestRow){
  if(r.quoted_amount==null||!Number.isFinite(r.quoted_amount)||r.quoted_amount<1||r.quoted_amount>100000)return;
  try{await navigator.clipboard.writeText(paymentSchedule(r));setSaveMessages(previous=>({...previous,[r.id]:'Payment schedule copied. No payment link or request was sent.'}));}
  catch{setSaveMessages(previous=>({...previous,[r.id]:'Could not copy the payment schedule. Please check clipboard permissions.'}));}
 }
 async function copyFollowUpEmail(r:RequestRow){
  if(r.status!=='quoted'||r.quoted_amount==null||r.quoted_amount<=0)return;
  try{
   await navigator.clipboard.writeText(followUpEmail(r));
   setSaveMessages(previous=>({...previous,[r.id]:'Follow-up copied. Paste it into your email app and send it manually; PureHome has not sent it.'}));
  }catch{
   setSaveMessages(previous=>({...previous,[r.id]:'Copy was blocked by your browser. Use Prepare follow-up email instead.'}));
  }
 }
 async function copyQuoteEmail(r:RequestRow){
  if(r.quoted_amount==null||r.quoted_amount<=0)return;
  try{
   await navigator.clipboard.writeText(quoteEmail(r));
   setSaveMessages(previous=>({...previous,[r.id]:'Quote email copied. Paste it into your email app and send it manually; PureHome has not sent it.'}));
  }catch{
   setSaveMessages(previous=>({...previous,[r.id]:'Copy was blocked by your browser. Use Prepare quote email instead.'}));
  }
 }

 function exportVisibleRequests(){
  if(!visible.length)return;
  // Export only rows already authorized and loaded in this owner session.
  const safeCell=(value:unknown)=>{
   const text=String(value??'');
   // Spreadsheet programs may interpret cells beginning with formula operators as executable formulas.
   const protectedText=/^[\s\u0000-\u001f]*[=+@-]/.test(text)?"'"+text:text;
   return '"'+protectedText.replace(/"/g,'""')+'"';
  };
  const headers=['Request ID','Received','Customer','Email','Phone','Service','Address','Preferred date','Status','Quoted amount USD','Deposit 30% USD','Balance 70% USD','Description'];
  const lines=[headers,...visible.map(r=>[r.id,r.created_at,r.customer_name,r.customer_email,r.customer_phone,r.services?.name??'',r.address,r.preferred_date??'',r.status,r.quoted_amount??'',r.quoted_amount!=null&&Number.isFinite(r.quoted_amount)&&r.quoted_amount>=1&&r.quoted_amount<=100000? (paymentParts(r.quoted_amount).depositCents/100).toFixed(2):'',r.quoted_amount!=null&&Number.isFinite(r.quoted_amount)&&r.quoted_amount>=1&&r.quoted_amount<=100000?(paymentParts(r.quoted_amount).balanceCents/100).toFixed(2):'',r.description])];
  const csv='\uFEFF'+lines.map(line=>line.map(safeCell).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  const link=document.createElement('a');
  link.href=url;link.download='purehome-quote-requests.csv';document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 async function load(nextPage:number){
  if(loading&&nextPage!==0)return;
  const requestId=++latestLoad.current;
  setLoading(true);
  const start=nextPage*100;
  try{
   const {data,error:loadError}=await supabase.from('quote_requests').select('id,customer_name,customer_email,customer_phone,address,description,preferred_date,status,quoted_amount,created_at,services(name)').order('created_at',{ascending:false}).order('id',{ascending:false}).range(start,start+100);
   // A refresh may finish before an older pagination request. Never let
   // the older response overwrite the latest owner-visible request list.
   if(requestId!==latestLoad.current)return;
   if(loadError){setError('Could not load quote requests. Check your administrator access.');return;}
   setError('');
   setPage(nextPage);
   setHasMore((data??[]).length>100);
   setRows(previous=>nextPage===0?(data??[]).slice(0,100):Array.from(new Map([...previous,...(data??[]).slice(0,100)].map(row=>[row.id,row])).values()));
  }catch{
   if(requestId===latestLoad.current)setError('Could not load quote requests. Check your connection and try again.');
  }finally{
   if(requestId===latestLoad.current)setLoading(false);
  }
 }
 async function refresh(){await load(0)}
 async function changeStatus(request:RequestRow,nextStatus:'reviewing'|'quoted'|'accepted'|'declined'|'closed'){
  if(request.status==='accepted'||request.status==='closed'||request.status==='declined'||(request.status==='quoted'&&nextStatus==='reviewing')){
   setSaveMessages(previous=>({...previous,[request.id]:'This request cannot be moved back to review. Contact the customer before making changes to an issued quote.'}));return;
  }
  if(request.status==='quoted'&&nextStatus==='quoted')return;
  if(nextStatus==='quoted'&&(request.quoted_amount==null||request.quoted_amount<=0)){
   setSaveMessages(previous=>({...previous,[request.id]:'Save a valid quote price before marking it as sent.'}));return;
  }
  if(nextStatus==='quoted'&&draftAmounts[request.id]!==undefined&&Number(draftAmounts[request.id])!==request.quoted_amount){
   setSaveMessages(previous=>({...previous,[request.id]:'Your draft price differs from the saved price. Save the new amount before marking the quote as sent.'}));return;
  }
  if(nextStatus==='accepted'&&(request.quoted_amount==null||!Number.isFinite(request.quoted_amount)||request.quoted_amount<1||request.quoted_amount>100000)){
   setSaveMessages(previous=>({...previous,[request.id]:'A valid saved quote is required before recording acceptance.'}));return;
  }
  if(nextStatus==='accepted'&&draftAmounts[request.id]!==undefined&&Number(draftAmounts[request.id])!==request.quoted_amount){
   setSaveMessages(previous=>({...previous,[request.id]:'Your draft price differs from the saved quote. Acceptance must refer to the exact price the customer agreed to.'}));return;
  }
  if(nextStatus==='accepted'&&request.status!=='quoted'){
   setSaveMessages(previous=>({...previous,[request.id]:'Only a quote already sent to the customer can be marked accepted.'}));return;
  }
  if(nextStatus==='accepted'&&!window.confirm('Only mark accepted after the customer has explicitly agreed to the saved price. This does not collect the deposit or confirm an appointment. Continue?'))return;
  if(nextStatus==='quoted'&&!window.confirm('Only mark this quote as sent after you have actually emailed the customer. Continue?'))return;
  if(nextStatus==='declined'&&!window.confirm('Mark this customer request as declined? This action locks the request in the dashboard.'))return;
  if(nextStatus==='closed'&&!window.confirm('Close this customer request? This action locks the request in the dashboard.'))return;
  setSavingId(request.id);
  setSaveMessages(previous=>({...previous,[request.id]:''}));
  let update=supabase.from('quote_requests').update({status:nextStatus}).eq('id',request.id).eq('status',request.status);
  // A quote must not be marked sent if its saved price changed in another session.
  if(nextStatus==='quoted'||nextStatus==='accepted')update=update.eq('quoted_amount',request.quoted_amount!);
  const result=await update.select('id,status').single();
  setSavingId(null);
  if(result.error||!result.data){setSaveMessages(previous=>({...previous,[request.id]:'Could not update the request. It may have changed since you loaded it. Refresh requests before trying again.'}));return;}
  setRows(previous=>previous.map(row=>row.id===request.id?{...row,status:result.data.status}:row));
  setSaveMessages(previous=>({...previous,[request.id]:nextStatus==='quoted'?'Marked as quoted. This records your manual confirmation; no email was sent by PureHome.':nextStatus==='accepted'?'Customer acceptance recorded manually. Deposit has not been collected and the appointment is not confirmed.':'Request status updated.'}));
 }
 async function savePrice(request:RequestRow){
  if(['quoted','accepted','closed','declined'].includes(request.status)){
   setSaveMessages(previous=>({...previous,[request.id]:'This quote is already issued or closed. Revisions require a separate customer communication and approval workflow.'}));return;
  }
  const raw=draftAmounts[request.id]?.trim()??(request.quoted_amount==null?'':String(request.quoted_amount));
  const amount=Number(raw);
  if(!/^\d+(?:\.\d{1,2})?$/.test(raw)||!Number.isFinite(amount)||amount<1||amount>100000){
   setSaveMessages(previous=>({...previous,[request.id]:'Enter a valid amount from $1 to $100,000 with at most two decimal places.'}));return;
  }
  setSavingId(request.id);
  setSaveMessages(previous=>({...previous,[request.id]:''}));
  let update=supabase.from('quote_requests').update({quoted_amount:amount}).eq('id',request.id).eq('status',request.status);
  // Compare the last known price as well as status so another owner session cannot be overwritten.
  update=request.quoted_amount==null?update.is('quoted_amount',null):update.eq('quoted_amount',request.quoted_amount);
  const result=await update.select('id,quoted_amount').single();
  setSavingId(null);
  if(result.error||!result.data){setSaveMessages(previous=>({...previous,[request.id]:'Could not save the price. This request may have changed. Refresh requests before trying again.'}));return;}
  setRows(previous=>previous.map(row=>row.id===request.id?{...row,quoted_amount:Number(result.data.quoted_amount)}:row));
  setDraftAmounts(previous=>({...previous,[request.id]:String(result.data.quoted_amount)}));
  setSaveMessages(previous=>({...previous,[request.id]:'Price saved privately. It has not been sent to the customer, and no payment or appointment was created.'}));
 }

 useEffect(()=>{void refresh();return ()=>{latestLoad.current+=1};},[]);
 return <section className="section"><h2>Customer quote requests</h2><p>Private owner view. Review each request before offering a custom price.</p><button type="button" disabled={loading} onClick={()=>void refresh()}>Refresh requests</button><button type="button" disabled={loading||Boolean(error)||visible.length===0} onClick={exportVisibleRequests}>Export filtered requests (CSV)</button><button type="button" disabled={loading||needsAttention===0} onClick={showNeedsAttention}>Review unpriced requests ({needsAttention})</button><button type="button" disabled={loading||quotedCount===0} onClick={showAwaitingReply}>Follow up on sent quotes ({quotedCount})</button><button type="button" disabled={loading||olderQuoteCount===0} onClick={showOlderQuotes}>Older sent quotes ({olderQuoteCount})</button><button type="button" disabled={loading||acceptedCount===0} onClick={showAccepted}>Customer-accepted quotes ({acceptedCount})</button><div className="quoteFilters"><label>Search requests<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Customer, email, address, or details" /></label><label>Status<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option><option value="needs_attention">Needs pricing (open requests)</option>{statuses.map(status=><option key={status} value={status}>{statusLabel(status)}</option>)}</select></label><label>Service<select value={serviceFilter} onChange={e=>setServiceFilter(e.target.value)}><option value="all">All services</option>{serviceNames.map(name=><option key={name} value={name}>{name}</option>)}</select></label><label>Sent quote age<select value={ageFilter} onChange={e=>setAgeFilter(e.target.value as 'all'|'7'|'14'|'30')}><option value="all">Any age</option><option value="7">7+ days since request</option><option value="14">14+ days since request</option><option value="30">30+ days since request</option></select></label><label>Pricing<select value={priceFilter} onChange={e=>setPriceFilter(e.target.value)}><option value="all">All requests</option><option value="unpriced">Needs a price</option><option value="priced">Already priced</option></select></label><label>Order<select value={sort} onChange={e=>setSort(e.target.value as 'newest'|'oldest')}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div><p role="status">Showing {visible.length} of {rows.length} loaded requests · {pendingCount} awaiting review · {reviewingCount} under review · {unpricedCount} awaiting prices · {pricedCount} priced · {quotedCount} sent quotes · {acceptedCount} accepted requests (not necessarily paid or booked){hasMore?' · More requests available':''}</p><button type="button" onClick={()=>{setFilter('all');setServiceFilter('all');setPriceFilter('all');setAgeFilter('all');setSearch('');setSort('newest')}} disabled={filter==='all'&&serviceFilter==='all'&&priceFilter==='all'&&ageFilter==='all'&&!search&&sort==='newest'}>Clear filters</button>{loading?<p>Loading requests…</p>:error?<p role="alert">{error}</p>:rows.length===0?<p>No quote requests received yet.</p>:visible.length===0?<p>No requests match these filters.</p>:visible.map(r=><article key={r.id} className="card"><h3>{r.customer_name}</h3><p>Service: {r.services?.name??'Cleaning service'}</p><p>{statusLabel(r.status)} · {new Date(r.created_at).toLocaleString()}</p><p>Requested: {r.preferred_date??'Date to be arranged'}</p><p>Saved price: {r.quoted_amount==null?'Not set':currency(r.quoted_amount)}</p>{r.quoted_amount!=null&&Number.isFinite(r.quoted_amount)&&r.quoted_amount>=1&&r.quoted_amount<=100000&&<p>Deposit (30%): {dollars(paymentParts(r.quoted_amount).depositCents)} · After cleaning (70%): {dollars(paymentParts(r.quoted_amount).balanceCents)}. Payment collection is not yet enabled.</p>}<button type="button" aria-expanded={expanded.includes(r.id)} onClick={()=>setExpanded(current=>current.includes(r.id)?current.filter(id=>id!==r.id):[...current,r.id])}>{expanded.includes(r.id)?'Hide details':'View details'}</button>{expanded.includes(r.id)&&<div><p>Email: <a href={`mailto:${r.customer_email}`}>{r.customer_email}</a></p><p>Phone: {r.customer_phone}</p><p>Address: {r.address}</p><p>Cleaning details: {r.description}</p><div><label>Request status<select value={r.status} disabled={savingId!==null||['accepted','closed','declined'].includes(r.status)} onChange={e=>void changeStatus(r,e.target.value as 'reviewing'|'quoted'|'accepted'|'declined'|'closed')}><option value={r.status}>{statusLabel(r.status)}</option>{(['reviewing','quoted','accepted','declined','closed'] as const).filter(status=>status!==r.status&&(status!=='accepted'||r.status==='quoted')&&(r.status!=='quoted'||status!=='reviewing')).map(status=><option key={status} value={status}>{statusLabel(status)}</option>)}</select></label><p>Choose “Quoted” only after personally sending the quote; choose “Accepted” only after the customer explicitly agrees. Neither action sends messages, collects payment, or confirms bookings.</p></div><div><label>Draft price (USD)<input type="number" min="1" max="100000" step="0.01" inputMode="decimal" disabled={savingId!==null||['quoted','accepted','closed','declined'].includes(r.status)} value={draftAmounts[r.id]??(r.quoted_amount==null?'':String(r.quoted_amount))} onChange={e=>setDraftAmounts(previous=>({...previous,[r.id]:e.target.value}))} placeholder="Enter your custom price" /></label><button type="button" disabled={savingId!==null||['quoted','accepted','closed','declined'].includes(r.status)} onClick={()=>void savePrice(r)}>{savingId===r.id?'Saving…':'Save price privately'}</button><p role="status">{saveMessages[r.id]??''}</p>{['quoted','accepted','closed','declined'].includes(r.status)&&<p>Price editing is locked for issued, declined, accepted, or closed requests. Revisions need a separate customer approval workflow.</p>}<p>Saving a price does not send a quote, collect payment, or confirm an appointment. The email below uses only the last saved price and opens a draft you can review before sending.</p>{r.quoted_amount!=null&&Number.isFinite(r.quoted_amount)&&r.quoted_amount>=1&&r.quoted_amount<=100000&&<a href={`mailto:${r.customer_email}?subject=${encodeURIComponent('Your PureHome cleaning quote')}&body=${encodeURIComponent(quoteEmail(r))}`}>Prepare quote email</a>}{r.quoted_amount!=null&&r.quoted_amount>=1&&r.quoted_amount<=100000&&<button type="button" disabled={savingId!==null} onClick={()=>void copyQuoteEmail(r)}>Copy quote email</button>}{r.quoted_amount!=null&&Number.isFinite(r.quoted_amount)&&r.quoted_amount>=1&&r.quoted_amount<=100000&&<button type="button" disabled={savingId!==null} onClick={()=>void copyPaymentSchedule(r)}>Copy 30/70 payment schedule</button>}{r.status==='quoted'&&r.quoted_amount!=null&&Number.isFinite(r.quoted_amount)&&r.quoted_amount>=1&&r.quoted_amount<=100000&&<div><p>Customer acceptance is currently handled by email. Confirm the customer accepts the saved quote before arranging a deposit; record acceptance using the status selector after the customer replies. This does not reserve a date.</p><a href={`mailto:${r.customer_email}?subject=${encodeURIComponent('Next steps for your PureHome cleaning quote')}&body=${encodeURIComponent(acceptanceStepsEmail(r))}`}>Prepare acceptance email</a><button type="button" disabled={savingId!==null} onClick={()=>void copyAcceptanceSteps(r)}>Copy acceptance instructions</button><p>Follow up on a manually sent quote. This does not send an email or reserve an appointment.</p><a href={`mailto:${r.customer_email}?subject=${encodeURIComponent('Following up on your PureHome cleaning quote')}&body=${encodeURIComponent(followUpEmail(r))}`}>Prepare follow-up email</a><button type="button" disabled={savingId!==null} onClick={()=>void copyFollowUpEmail(r)}>Copy follow-up email</button></div>}</div></div>}</article>)}{!loading&&!error&&hasMore&&<button type="button" onClick={()=>void load(page+1)}>Load more requests</button>}</section>
}