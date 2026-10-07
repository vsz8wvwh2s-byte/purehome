import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { addAddress, createBooking, createPayment, getAddresses } from '../supabase';
import { minimumBookingDate, validateBooking } from '../lib/validation';

export type Service = { id:string; name:string; description:string; base_price:number; estimated_minutes:number };

type Props = { service:Service; user:User|null; back:()=>void; account:()=>void; success:(id:string)=>void };

export default function BookingForm({service,user,back,account,success}:Props){
  const [addresses,setAddresses]=useState<any[]>([]),[addressId,setAddressId]=useState(''),[line1,setLine1]=useState(''),[city,setCity]=useState(''),[state,setState]=useState(''),[zip,setZip]=useState(''),[date,setDate]=useState(''),[time,setTime]=useState('10:00'),[notes,setNotes]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{if(user)getAddresses().then(({data})=>{setAddresses(data??[]);if(data?.[0])setAddressId(data[0].id)})},[user]);
  async function submit(){
    if(!user)return account();
    const validation=validateBooking({date,time,addressId,line1,city,state,zip});
    if(validation){setMsg(validation);return}
    setBusy(true);setMsg('');let aid=addressId;
    if(!aid){const r=await addAddress({address_line_1:line1.trim(),city:city.trim(),state:state.trim().toUpperCase(),postal_code:zip.trim()});if(r.error){setMsg(r.error.message);setBusy(false);return}aid=r.data.id}
    const start=new Date(`${date}T${time}:00`),end=new Date(start.getTime()+service.estimated_minutes*60000);
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
  return <section className="booking"><button className="back" onClick={back}>← Back</button><div className="bookingGrid"><div><p className="eyebrow">Book your clean</p><h1>{service.name}</h1><p>{service.description}</p>{user&&addresses.length>0&&<label>Saved address<select value={addressId} onChange={e=>setAddressId(e.target.value)}><option value="">Add a new address</option>{addresses.map(a=><option key={a.id} value={a.id}>{a.address_line_1}, {a.city}</option>)}</select></label>}{(!user||!addressId)&&<><label>Street address<input autoComplete="street-address" value={line1} onChange={e=>setLine1(e.target.value)} placeholder="123 Main Street"/></label><div className="fieldRow"><label>City<input autoComplete="address-level2" value={city} onChange={e=>setCity(e.target.value)}/></label><label>State<input autoComplete="address-level1" value={state} maxLength={2} onChange={e=>setState(e.target.value.toUpperCase())}/></label><label>ZIP<input autoComplete="postal-code" inputMode="numeric" value={zip} onChange={e=>setZip(e.target.value)}/></label></div></>}<div className="fieldRow"><label>Date<input type="date" min={minimumBookingDate()} value={date} onChange={e=>setDate(e.target.value)}/></label><label>Start time<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label></div><label>Notes<textarea maxLength={1000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Anything your cleaner should know?"/></label>{msg&&<p className="formMsg" role="alert">{msg}</p>}</div><aside><h3>Booking summary</h3><div className="summary"><span>{service.name}</span><strong>${service.base_price}</strong></div><div className="summary"><span>Estimated time</span><strong>{Math.round(service.estimated_minutes/60)} hr</strong></div><button className="primary full" disabled={busy} onClick={submit}>{busy?'Preparing checkout…':user?'Continue to payment':'Create account / Sign in'}</button><small>You’ll review and pay securely on the next step.</small></aside></div></section>
}
