export class ApiError extends Error {
  constructor(status, message, code = 'REQUEST_FAILED') { super(message); this.status = status; this.code = code; }
}
export function replyError(res, error) {
  const known = error instanceof ApiError;
  res.status(known ? error.status : 500).json({
    error: known ? error.message : 'Something went wrong. Please try again.',
    code: known ? error.code : 'INTERNAL_ERROR',
  });
}
export function requireMethod(req, res, method) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === method) return true;
  res.setHeader('Allow', method);
  res.status(405).json({ error: 'Method not allowed.' });
  return false;
}
export async function fetchJson(url, options = {}, timeout = 12000) {
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeout) });
    if (!response.ok) throw new ApiError(502, 'The data provider is temporarily unavailable. Please try again.', 'PROVIDER_UNAVAILABLE');
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(504, 'The data provider could not be reached in time. Please try again.', 'PROVIDER_TIMEOUT');
  }
}
// Per-instance burst protection. For a public deployment, enable Turnstile and
// Vercel Firewall rate limiting as documented in README; this is not a global quota.
const requests = new Map();
export function checkRate(req, limit = 8) {
  const ip = req.headers['x-real-ip'] || req.socket?.remoteAddress || 'local';
  const key = (req.url || '/').split('?')[0] + ':' + ip;
  const now = Date.now();
  for (const [ip, item] of requests) if (now - item.start > 60000) requests.delete(ip);
  const item = requests.get(key) || { start: now, count: 0 };
  item.count++;
  requests.set(key, item);
  if (item.count > limit) throw new ApiError(429, 'A few too many requests. Please wait a minute and try again.', 'RATE_LIMITED');
}
