import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://iphxpqycoaqwjhecfajp.supabase.co',
  'sb_publishable_RQun43vpCq23lsYKU2YB6g_5k1xQ4EI'
);

export async function signUp(email:string,password:string,fullName:string){
  return supabase.auth.signUp({email,password,options:{data:{full_name:fullName}}});
}

export async function signIn(email:string,password:string){
  return supabase.auth.signInWithPassword({email,password});
}

export async function signOut(){ return supabase.auth.signOut(); }

export async function createBooking(input:{address_id:string;scheduled_start:string;scheduled_end:string;items:{service_id:string;quantity:number}[];customer_notes?:string}){
  return supabase.functions.invoke('create-booking',{body:input});
}
