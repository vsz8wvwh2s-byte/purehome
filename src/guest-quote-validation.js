// Pure functions shared by the guest quote form. The server must independently validate all inputs.
export function validCalendarDate(value,today) {
 if(value==='')return true; // Preferred date is optional.
 if(typeof value!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)||value<today)return false;
 const [year,month,day]=value.split('-').map(Number);
 const parsed=new Date(Date.UTC(year,month-1,day));
 return parsed.getUTCFullYear()===year&&parsed.getUTCMonth()+1===month&&parsed.getUTCDate()===day;
}
export function validateGuestQuoteDraft(form,today) {
 if(!form||!['Standard Cleaning','Deep Cleaning'].includes(form.service))return 'Choose a valid cleaning service.';
 if(typeof form.name!=='string'||!form.name.trim()||form.name.trim().length>120)return 'Enter your full name (up to 120 characters).';
 if(typeof form.email!=='string'||form.email.trim().length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))return 'Enter a valid email address.';
 if(typeof form.phone!=='string'||form.phone.trim().length<7||form.phone.trim().length>30)return 'Enter a phone number between 7 and 30 characters.';
 if(typeof form.address!=='string'||!form.address.trim()||form.address.trim().length>300)return 'Enter your cleaning address (up to 300 characters).';
 if(typeof form.description!=='string'||form.description.trim().length<10||form.description.trim().length>3000)return 'Describe the cleaning work in 10–3000 characters.';
 if(!validCalendarDate(form.preferredDate,today))return 'Choose a real, current or future preferred date.';
 return null;
}
