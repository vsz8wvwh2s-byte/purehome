// Read an incoming webhook body without buffering unlimited attacker input.
// Return bytes only when the entire stream fits the configured limit.
export async function readLimitedBody(stream,limit=65536) {
 if(!Number.isSafeInteger(limit)||limit<1||limit>1048576)throw new RangeError('Invalid body limit');
 if(!stream||typeof stream.getReader!=='function')return {ok:false,reason:'missing_body'};
 const reader=stream.getReader();
 const chunks=[];
 let length=0;
 try {
  while(true){
   const {value,done}=await reader.read();
   if(done)break;
   if(!(value instanceof Uint8Array)){
    await reader.cancel().catch(()=>{});
    return {ok:false,reason:'invalid_chunk'};
   }
   length+=value.byteLength;
   if(length>limit){await reader.cancel().catch(()=>{});return {ok:false,reason:'too_large'};}
   chunks.push(value);
  }
 }catch{
  await reader.cancel().catch(()=>{});
  return {ok:false,reason:'read_failed'};
 }
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);
 let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 return {ok:true,bytes};
}
