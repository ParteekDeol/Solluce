import { AnalyzeSchema, isValidImage } from '../shared/schema.js';
import { analyzeCrop } from '../server/analyze.js';
import { forecast } from '../server/weather.js';
import { ApiError, checkRate, replyError, requireMethod } from '../server/http.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;
  try {
    checkRate(req, 6);
    if (Number(req.headers['content-length'] || 0) > 4000000) throw new ApiError(413, 'The photos are too large. Please select smaller images.');
    const parsed = AnalyzeSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, 'Check your field details and add 1–3 valid crop photos.', 'INVALID_INPUT');
    const input = parsed.data;
    if (input.photos.some(p => !isValidImage(p))) throw new ApiError(400, 'One of the photos is not a valid JPEG, PNG or WebP image.', 'INVALID_IMAGE');
    if (!process.env.GEMINI_API_KEY) throw new ApiError(503, 'Live crop analysis is being connected. Explore the sample report while Gemini is being set up.', 'AI_NOT_CONFIGURED');
    if (process.env.TURNSTILE_SECRET_KEY) {
      let verified = false;
      try {
        const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST', body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: input.turnstileToken || '' }),
          signal: AbortSignal.timeout(5000),
        });
        verified = (await result.json()).success === true;
      } catch { /* Fail closed if challenge verification is unavailable. */ }
      if (!verified) throw new ApiError(403, 'Complete the verification and try again.', 'CHALLENGE_REQUIRED');
    }
    let weather = null;
    let weatherWarning = null;
    if (input.location) {
      try { weather = await forecast(input.location, 8000); }
      catch { weatherWarning = 'Live weather was unavailable. This report does not include a forecast-based water estimate.'; }
    } else weatherWarning = 'No confirmed location was provided. Weather was excluded from this analysis.';
    const result = await analyzeCrop(input, weather);
    res.status(200).json({
      id: crypto.randomUUID(), createdAt: new Date().toISOString(), sample: false,
      field: input.field, quality: input.quality, concerns: input.concerns, language: input.language,
      location: input.location, photoCount: input.photos.length,
      ...result, weather, weatherWarning, completed: [],
    });
  } catch (error) { replyError(res, error); }
}
