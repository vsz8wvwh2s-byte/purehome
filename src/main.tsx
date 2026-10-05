import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Service={name:string;price:number;description:string};
const services:Service[]=[
{name:'Standard Clean',price:119,description:'Kitchen, bathrooms, bedrooms, floors and surfaces.'},
{name:'Deep Clean',price:189,description:'A detailed top-to-bottom reset for your home.'},
{name:'Move In / Out',price:249,description:'A thorough clean for moving day and empty spaces.'}
];

function App(){
 const [selected,setSelected]=useState<Service>(services[0]);
 const [step,setStep]=useState<'home'|'book'>('home');
 return <main>
  <header><a className="brand" href="#">Pure<span>Home</span></a><nav><a href="#services">Services</a><a href="#how">How it works</a><button className="ghost">Sign in</button></nav></header>
  {step==='home'?<>
   <section className="hero"><div><p className="eyebrow">A cleaner home, without the hassle.</p><h1>Come home to <em>clean.</em></h1><p className="lede">Book trusted home cleaning in minutes. Simple pricing, dependable cleaners, and a home that feels fresh again.</p><div className="actions"><button className="primary" onClick={()=>setStep('book')}>Book a cleaning</button><a href="#services">See services →</a></div><div className="trust"><b>✓ Secure booking</b><b>✓ Trusted cleaners</b><b>✓ Easy scheduling</b></div></div><div className="heroCard"><div className="sparkle">✦</div><h3>Your home deserves the reset.</h3><p>Flexible cleaning appointments built around your schedule.</p><div className="mini"><span>Next availability</span><strong>Choose your date</strong></div></div></section>
   <section id="services" className="section"><p className="eyebrow">Cleaning made simple</p><h2>Choose your clean</h2><div className="cards">{services.map(s=><article key={s.name}><div className="icon">✦</div><h3>{s.name}</h3><p>{s.description}</p><div className="price">From <strong>${s.price}</strong></div><button onClick={()=>{setSelected(s);setStep('book')}}>Choose service</button></article>)}</div></section>
   <section id="how" className="how"><p className="eyebrow">How PureHome works</p><h2>Clean home. Three easy steps.</h2><div className="steps"><div><b>01</b><h3>Choose your clean</h3><p>Select the service that fits your home.</p></div><div><b>02</b><h3>Pick your time</h3><p>Choose a date and time that works for you.</p></div><div><b>03</b><h3>Relax</h3><p>Your cleaner handles the rest.</p></div></div></section>
  </>:<Booking service={selected} back={()=>setStep('home')}/>} 
  <footer><b>PureHome</b><span>Clean home. Clear mind.</span></footer>
 </main>
}

function Booking({service,back}:{service:Service;back:()=>void}){
 const [date,setDate]=useState(''); const [address,setAddress]=useState('');
 return <section className="booking"><button className="back" onClick={back}>← Back</button><div className="bookingGrid"><div><p className="eyebrow">Book your clean</p><h1>{service.name}</h1><p>{service.description}</p><label>Service address<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="123 Main Street"/></label><label>Preferred date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Notes<textarea placeholder="Anything your cleaner should know?"/></label></div><aside><h3>Booking summary</h3><div className="summary"><span>{service.name}</span><strong>${service.price}</strong></div><div className="summary"><span>Estimated total</span><strong>${service.price}</strong></div><button className="primary full" disabled={!date||!address}>Continue to account</button><small>Payment is not charged on this preview screen.</small></aside></div></section>
}
createRoot(document.getElementById('root')!).render(<App/>);
