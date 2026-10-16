export function checkoutReturn(search,pathname,hash=''){
 const params=new URLSearchParams(search);
 const paymentValues=params.getAll('payment');
 const payment=paymentValues.length===1?paymentValues[0]:null;
 const bookingValues=params.getAll('booking_id');
 const booking=bookingValues.length===1?bookingValues[0]:null;
 if(payment!=='success'&&payment!=='cancelled')return {payment:null,bookingId:'',url:null};
 const bookingId=payment==='success'&&typeof booking==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(booking)?booking:'';
 params.delete('payment');params.delete('booking_id');
 const query=params.toString();
 return {payment,bookingId,url:pathname+(query?'?'+query:'')+hash};
}
