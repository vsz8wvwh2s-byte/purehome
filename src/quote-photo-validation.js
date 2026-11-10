// Shared client-side checks for the planned private photo-upload flow.
// These checks improve feedback, but the eventual upload endpoint must
// independently inspect content and enforce size, count, and access rules.
const allowedTypes = new Set(['image/jpeg','image/png','image/webp','image/heic','image/heif']);
export function validateQuotePhotos(files) {
  if (!Array.isArray(files)) return {ok:false,message:'Choose valid image files.'};
  if (files.length > 5) return {ok:false,message:'Choose no more than five photos.'};
  let totalBytes = 0;
  const seen = new Set();
  for (const file of files) {
    if (!file || typeof file.name !== 'string' || !Number.isSafeInteger(file.size) || file.size <= 0 || typeof file.type !== 'string') {
      return {ok:false,message:'One of the selected photos is empty or invalid.'};
    }
    if (!allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
      return {ok:false,message:'Choose JPG, PNG, WebP, or HEIC photos no larger than 5 MB each.'};
    }
    const key = `${file.name}:${file.size}:${file.lastModified}`;
    if (seen.has(key)) return {ok:false,message:'The same photo was selected more than once.'};
    seen.add(key);
    totalBytes += file.size;
    if (totalBytes > 15 * 1024 * 1024) return {ok:false,message:'Keep the combined photo size at or below 15 MB.'};
  }
  return {ok:true,count:files.length,totalBytes};
}
