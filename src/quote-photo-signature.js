// Client-side image signature check for accidental mislabeled files.
// The upload backend must repeat validation independently before storing any file.
export function detectImageType(bytes) {
 if(!(bytes instanceof Uint8Array))return null;
 if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return 'image/png';
 if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
 if(bytes.length>=12&&String.fromCharCode(...bytes.slice(4,8))==='ftyp') {
  const brand=String.fromCharCode(...bytes.slice(8,12));
  // mif1/msf1 are generic HEIF containers and can also hold AVIF; do not guess HEIC.
  if(['heic','heix','hevc','hevx'].includes(brand))return 'image/heic';
 }
 return null;
}
export async function inspectQuotePhotoSignatures(files) {
 if(!Array.isArray(files))return {ok:false,message:'Invalid photo selection.'};
 for(const file of files){
  if(!file||typeof file.slice!=='function')return {ok:false,message:'Invalid photo file.'};
  let bytes;
  try{bytes=new Uint8Array(await file.slice(0,32).arrayBuffer());}
  catch{return {ok:false,message:'Could not read a selected photo.'};}
  const detected=detectImageType(bytes);
  const matches=detected===file.type||(detected==='image/heic'&&file.type==='image/heif');
  if(!matches)return {ok:false,message:'A selected file does not match its image format. Choose a genuine JPG, PNG, WebP, or HEIC photo.'};
 }
 return {ok:true};
}
