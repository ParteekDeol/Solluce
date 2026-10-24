import { requireMethod } from '../server/http.js';
export default function handler(req, res) {
  if (!requireMethod(req, res, 'GET')) return;
  res.status(200).json({ analysisConfigured: Boolean(process.env.GEMINI_API_KEY), challengeRequired: Boolean(process.env.TURNSTILE_SECRET_KEY) });
}
