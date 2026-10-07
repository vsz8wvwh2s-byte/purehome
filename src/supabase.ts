import { createClient } from '@supabase/supabase-js';

export const supabase = createClient('https://iphxpqycoaqwjhecfajp.supabase.co','sb_publishable_RQun43vpCq23lsYKU2YB6g_5k1xQ4EI');
export async function signUp(email:string,password:string,fullName:string){return supabase.auth.signUp({email,password,options:{data:{full_name:fullName}}});}
export async function signIn(email:string,password:string){return supabase.auth.signInWithPassword({email,password});}
export async function signOut(){return supabase.auth.signOut();}
export async function getMyRoles(){return supabase.from('user_roles').select('role');}
export async function getServices(){return supabase.from('services').select('id,name,description,base_price,estimated_minutes').eq('is_active',true).order('base_price');}
export async function getAddresses(){return supabase.from('customer_addresses').select('*').order('is_default',{ascending:false}).order('created_at');}
export async function addAddress(input:{address_line_1:string;address_line_2?:string;city:string;state:string;postal_code:string}){const{data:{user}}=await supabase.auth.getUser();if(!user)return{data:null,error:new Error('Please sign in first')};return supabase.from('customer_addresses').insert({...input,customer_id:user.id,label:'Home',country:'US'}).select().single();}
export async function getMyBookings(){return supabase.from('bookings').select('id,booking_number,status,scheduled_start,scheduled_end,total,currency,created_at').order('scheduled_start',{ascending:false});}
export async function getBooking(booking_id:string){return supabase.from('bookings').select('id,booking_number,status,scheduled_start,scheduled_end,total,currency,created_at').eq('id',booking_id).single();}
export async function getCleanerAssignments(){return supabase.from('cleaner_assignments').select('id,booking_id,status,assigned_at,accepted_at,started_at,completed_at,cleaner_notes,bookings(id,booking_number,status,scheduled_start,scheduled_end,customer_notes,total,currency)').order('assigned_at',{ascending:false});}
export async function getAdminBookings(){return supabase.from('bookings').select('id,booking_number,customer_id,status,scheduled_start,scheduled_end,total,currency,customer_notes,created_at').order('scheduled_start',{ascending:false}).limit(100);}
export async function getAvailableCleaners(){return supabase.from('cleaner_profiles').select('user_id,rating,review_count,is_available,background_check_verified,hourly_rate').eq('is_available',true).order('rating',{ascending:false});}
export async function getProfiles(ids:string[]){if(!ids.length)return{data:[],error:null};return supabase.from('profiles').select('id,first_name,last_name,email,phone').in('id',ids);}
export async function assignCleaner(booking_id:string,cleaner_id:string){return supabase.functions.invoke('assign-cleaner',{body:{booking_id,cleaner_id}});}
export async function acceptAssignment(assignment_id:string){return supabase.functions.invoke('accept-assignment',{body:{assignment_id}});}
export async function completeJob(assignment_id:string,cleaner_notes?:string){return supabase.functions.invoke('complete-job',{body:{assignment_id,cleaner_notes}});}
export async function createBooking(input:{address_id:string;scheduled_start:string;scheduled_end:string;items:{service_id:string;quantity:number}[];customer_notes?:string}){return supabase.functions.invoke('create-booking',{body:input});}
export async function cancelBooking(booking_id:string,reason='Cancelled by customer'){return supabase.functions.invoke('cancel-booking',{body:{booking_id,reason}});}
export async function createPayment(booking_id:string){return supabase.functions.invoke('create-payment',{body:{booking_id}});}
export async function retryPayment(booking_id:string){return createPayment(booking_id);}

export async function markEnRoute(assignment_id:string){return supabase.functions.invoke('update-assignment-status',{body:{assignment_id,status:'en_route'}});}
export async function markArrived(assignment_id:string){return supabase.functions.invoke('update-assignment-status',{body:{assignment_id,status:'arrived'}});}
export async function startJob(assignment_id:string){return supabase.functions.invoke('update-assignment-status',{body:{assignment_id,status:'in_progress'}});}

export async function getNotifications(){return supabase.from('notifications').select('id,type,title,body,read_at,created_at,booking_id').order('created_at',{ascending:false}).limit(50);}
export async function markNotificationRead(id:string){return supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id);}

export async function getCleanerProfile(){const{data:{user}}=await supabase.auth.getUser();if(!user)return{data:null,error:new Error('Please sign in first')};return supabase.from('cleaner_profiles').select('user_id,rating,review_count,hourly_rate,background_check_verified,is_available,service_radius_miles').eq('user_id',user.id).single();}
export async function setCleanerAvailability(is_available:boolean){const{data:{user}}=await supabase.auth.getUser();if(!user)return{data:null,error:new Error('Please sign in first')};return supabase.from('cleaner_profiles').update({is_available}).eq('user_id',user.id).select().single();}
