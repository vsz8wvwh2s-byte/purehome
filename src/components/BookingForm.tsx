import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { addAddress, checkServiceZip, createBooking, createPayment, getAddresses, getBusinessSettings } from '../supabase';
import { minimumBookingDate, validateBooking } from '../lib/validation';

export type Service = { id:string; name:string; description:string; base_price:number; estimated_minutes:number };

type Props = { service:Service; user:User|null; back:()=>void; account:()=>void; success:(id:string)=>void };

export default function BookingForm({service,user,back,account,success}:Props){
  const [addresses,setAddresses]=useState<any[]>([]),[addressId,setAddressId]=useState(''),[savedCoverage,setSavedCoverage]=useState<Record<string,boolean>>({}),[coverageLoading,setCoverageLoading]=useState(false),[line1,setLine1]=useState(''),[city,setCity]=useState(''),[state,setState]=useState(''),[zip,setZip]=useState(''),[date,setDate]=useState(''),[time,setTime]=useState('10:00'),[notes,setNotes]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false),[leadHours,setLeadHours]=useState(2);
  useEffect(()=>{getBusinessSettings().then(({data})=>{if(data?.booking_lead_hours!=null)setLeadHours(Number(data.booking_lead_hours))});},[]);
  useEffect(()=>{if(user){setCoverageLoading(true);getAddresses().then(async({data,error})=>{if(error){setMsg('We could not load your saved addresses. You can still enter a new address.');setAddresses([]);setAddressId('');return}const list=data??[];setAddresses(list);const checks=await Promise.all(list.map(async a=>{const r=await checkServiceZip(String(a.postal_code??''));return [a.id,r.error?null:r.data?.available===true] as const}));const coverage=Object.fromEntries(checks);setSavedCoverage(coverage as Record<string,boolean>);const preferred=list.find(a=>coverage[a.id]===true)??null;setAddressId(preferred?.id??'')}).catch(()=>{setMsg('We could not verify saved-address coverage. Please enter a new address.')}).finally(()=>setCoverageLoading(false))}},[user]);
  async function submit(){
    if(!user)return account();
    if(coverageLoading){setMsg('Please wait while we verify service coverage.');return}
    const validation=validateBooking({date,time,addressId,line1,city,state,zip});
    if(validation){setMsg(validation);return}
    setBusy(true);setMsg('');let aid=addressId;
    if(aid&&savedCoverage[aid]!==true){setMsg('This saved address is outside PureHome’s current service area. Choose another address or add a new one.');setBusy(false);return}
    if(!aid){const coverage=await checkServiceZip(zip.trim());if(coverage.error){setMsg('We could not check service availability right now. Please try again.');setBusy(false);return}if(!coverage.data?.available){setMsg('This address is outside PureHome’s current 100-mile service area around 28025.');setBusy(false);return}}
    if(!aid){const r=await addAddress({address_line_1:line1.trim(),city:city.trim(),state:state.trim().toUpperCase(),postal_code:zip.trim()});if(r.error){setMsg(r.error.message);setBusy(false);return}aid=r.data.id}
    const start=new Date(`${date}T${time}:00`);if(start.getTime()<Date.now()+leadHours*3600000){setMsg(`Please choose a time at least ${leadHours} hours from now.`);setBusy(false);return}const end=new Date(start.getTime()+service.estimated_minutes*60000);
    const r=await createBooking({address_id:aid,scheduled_start:start.toISOString(),scheduled_end:end.toISOString(),items:[{service_id:service.id,quantity:1}],customer_notes:notes.trim()||undefined});
    if(r.error){setBusy(false);setMsg(r.error.message);return}
    const bookingId=r.data.booking_id;
    const payment=await createPayment(bookingId);
    setBusy(false);
    if(payment.error){setMsg(`Booking created, but checkout could not start: ${payment.error.message}`);return}
    const checkoutUrl=payment.data?.checkout_url??payment.data?.url;
    if(checkoutUrl){window.location.assign(checkoutUrl);return}
    setMsg('Booking saved. Secure checkout is not available yet, and no charge was made.')
  }
  return <section className="booking"><button className="back" onClick={back}>← Back</button><div className="bookingGrid"><div><p className="eyebrow">Book your clean</p><h1>{service.name}</h1><p>{service.description}</p>{user&&addresses.length>0&&<label>Saved address<select value={addressId} onChange={e=>setAddressId(e.target.value)}><option value="">Add a new address</option>{addresses.map(a=><option key={a.id} value={a.id} disabled={savedCoverage[a.id]!==true}>{a.address_line_1}, {a.city}{savedCoverage[a.id]===false?' — outside service area':savedCoverage[a.id]===undefined||savedCoverage[a.id]===null?' — coverage unavailable':''}</option>)}</select></label>}{(!user||!addressId)&&<><label>Street address<input autoComplete="street-address" value={line1} onChange={e=>setLine1(e.target.value)} placeholder="123 Main Street"/></label><div className="fieldRow"><label>City<input autoComplete="address-level2" value={city} onChange={e=>setCity(e.target.value)}/></label><label>State<input autoComplete="address-level1" value={state} maxLength={2} onChange={e=>setState(e.target.value.toUpperCase())}/></label><label>ZIP<input autoComplete="postal-code" inputMode="numeric" value={zip} onChange={e=>setZip(e.target.value)}/></label></div></>}<div className="fieldRow"><label>Date<input type="date" min={minimumBookingDate()} value={date} onChange={e=>setDate(e.target.value)}/></label><label>Start time<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label></div><label>Notes<textarea maxLength={1000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Anything your cleaner should know?"/></label>{msg&&<p className="formMsg" role="alert">{msg}</p>}</div><aside><h3>Booking summary</h3><div className="summary"><span>{service.name}</span><strong>${service.base_price}</strong></div><div className="summary"><span>Estimated time</span><strong>{Math.round(service.estimated_minutes/60)} hr</strong></div><button className="primary full" disabled={busy||coverageLoading} onClick={submit}>{busy?'Preparing checkout…':coverageLoading?'Checking service area…':user?'Continue to payment':'Create account / Sign in'}</button><small>Bookings require at least {leadHours} hours’ notice. You’ll review and pay securely on the next step.</small></aside></div></section>
}
