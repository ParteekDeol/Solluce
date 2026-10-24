import { ApiError, fetchJson } from './http.js';
import { LocationSchema } from '../shared/schema.js';

export async function geocode(address) {
  if (!address || address.length > 200) throw new ApiError(400, 'Enter a California farm address or city.');
  let location;
  if (/^\d+\s+\S+/.test(address)) {
    const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress');
    url.search = new URLSearchParams({ address, benchmark: 'Public_AR_Current', format: 'json' });
    const data = await fetchJson(url, {}, 15000);
    const match = data.result?.addressMatches?.[0];
    if (!match) throw new ApiError(404, 'That street address could not be located. Try the full street, city and ZIP, or use your nearest city.');
    location = { name: match.matchedAddress, latitude: match.coordinates.y, longitude: match.coordinates.x, precision: 'address' };
  } else {
    const name = address.replace(/,\s*(CA|California|USA|United States).*$/i, '').trim();
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.search = new URLSearchParams({ name, count: '20', language: 'en', format: 'json', countryCode: 'US' });
    const data = await fetchJson(url);
    const match = data.results?.find(r => r.country_code === 'US' && r.admin1 === 'California');
    if (!match) throw new ApiError(404, 'No California location found. Try a nearby city such as Manteca, Modesto or Fresno.');
    location = { name: match.name + ', California', latitude: match.latitude, longitude: match.longitude, precision: 'city' };
  }
  if (!LocationSchema.safeParse(location).success) throw new ApiError(400, 'Solluce currently supports farms in California.');
  return location;
}

export async function forecast(location, timeout = 12000) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(location.latitude), longitude: String(location.longitude),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration,sunshine_duration,wind_speed_10m_max',
    temperature_unit: 'fahrenheit', wind_speed_unit: 'mph',
    timezone: 'America/Los_Angeles', forecast_days: '7',
  });
  const data = await fetchJson(url, {}, timeout);
  if (!data.daily?.time?.length || !data.current || !Number.isFinite(data.current.temperature_2m)) {
    throw new ApiError(502, 'The weather provider returned an incomplete forecast.');
  }
  return {
    source: 'Open-Meteo', fetchedAt: new Date().toISOString(), sample: false, location,
    current: {
      temperature: data.current.temperature_2m, humidity: data.current.relative_humidity_2m,
      wind: data.current.wind_speed_10m, code: data.current.weather_code, time: data.current.time,
    },
    days: data.daily.time.map((date, i) => ({
      date, high: data.daily.temperature_2m_max[i], low: data.daily.temperature_2m_min[i],
      precipitation: data.daily.precipitation_sum[i], rainChance: data.daily.precipitation_probability_max[i],
      et0: data.daily.et0_fao_evapotranspiration[i],
      sunshineHours: data.daily.sunshine_duration[i] == null ? null : data.daily.sunshine_duration[i] / 3600,
      wind: data.daily.wind_speed_10m_max[i], code: data.daily.weather_code[i],
    })),
  };
}
