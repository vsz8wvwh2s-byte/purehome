export function checkoutReturn(search,pathname,hash=''){
 const params=new URLSearchParams(search);
 const payment=params.getAll('payment').length===1?params.get('payment'):null;
 const booking=params.getAll('booking_id').length===1?params.get('booking_id'):null;
 if(payment!=='success'&&payment!=='cancelled')return {payment:null,bookingId:'',url:null};
 const bookingId=payment==='success'&&typeof booking==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(booking)?booking:'';
 params.delete('payment');params.delete('booking_id');
 const query=params.toString();
 return {payment,bookingId,url:pathname+(query?'?'+query:'')+hash};
}
