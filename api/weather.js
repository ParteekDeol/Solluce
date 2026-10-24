import { geocode, coordinatesLocation, forecast } from '../server/weather.js';
import { checkRate, replyError, requireMethod } from '../server/http.js';
export default async function handler(req, res) {
  if (!requireMethod(req, res, 'GET')) return;
  try {
    checkRate(req, 35);
    const hasCoordinateInput = req.query.latitude !== undefined || req.query.longitude !== undefined;
    const latitude = Number(req.query.latitude), longitude = Number(req.query.longitude);
    const location = hasCoordinateInput
      ? coordinatesLocation(latitude, longitude)
      : await geocode(String(req.query.address || '').trim());
    res.status(200).json(await forecast(location));
  } catch (error) { replyError(res, error); }
}
