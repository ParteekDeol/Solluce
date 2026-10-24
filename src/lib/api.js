export async function request(path, options = {}) {
  let response;
  try { response = await fetch(path, { ...options, signal: AbortSignal.timeout(65000) }); }
  catch { throw new Error('The connection was interrupted. Please check your internet and try again.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    const error = new Error(data?.error || 'The service is unavailable. Please try again.');
    error.code = data?.code;
    throw error;
  }
  return data;
}
export async function preparePhoto(file) {
  const heic = /\.(heic|heif)$/i.test(file.name) || ['image/heic','image/heif'].includes(file.type);
  if (!heic && !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG, WebP or HEIC photo.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Each photo must be smaller than 12 MB.');
  let source = file;
  if (heic) {
    try {
      const { heicTo } = await import('heic-to');
      source = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.88 });
    } catch { throw new Error('That HEIC photo could not be converted. Try another photo or export it as JPEG.'); }
  }
  const url = URL.createObjectURL(source);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const ratio = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * ratio);
    canvas.height = Math.round(image.naturalHeight * ratio);
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let preview = canvas.toDataURL('image/jpeg', 0.82);
    if (preview.length > 1400000) preview = canvas.toDataURL('image/jpeg', 0.60);
    if (preview.length > 1500000) throw new Error('This photo is still too large. Try a smaller image.');
    return { name: file.name, preview, data: preview.split(',')[1], mimeType: 'image/jpeg' };
  } catch (error) {
    if (error.message.includes('too large')) throw error;
    throw new Error('That photo could not be opened. Try another image.');
  } finally { URL.revokeObjectURL(url); }
}
