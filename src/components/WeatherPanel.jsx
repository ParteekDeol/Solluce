import { useState } from 'react';
import { MapPin, Wind, Droplets, ArrowUpRight, Search, RefreshCw } from 'lucide-react';
import { WeatherIcon, weatherLabel, Badge, Modal, Notice, Spinner, formatDate } from './ui';
import { request } from '../lib/api';
export default function WeatherPanel({ weather, onWeather, onPlan }) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function lookup(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { const result = await request('/api/weather?address=' + encodeURIComponent(address)); onWeather(result); setOpen(false); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <><article className="weather-card">
    <div className="weather-top"><span className="eyebrow">A LOOK OUTSIDE</span><Badge tone={weather.sample ? 'neutral' : 'green'} dot>{weather.sample ? 'Sample weather' : 'Live forecast'}</Badge></div>
    <button className="location-button" onClick={() => setOpen(true)}><MapPin size={14}/>{weather.location.name.replace(', California', ', CA')}<ArrowUpRight size={13}/></button>
    <div className="weather-now"><div><strong>{Math.round(weather.current.temperature)}<span>°F</span></strong><p>{weatherLabel(weather.current.code)}</p></div><WeatherIcon code={weather.current.code} size={64} strokeWidth={1.2}/></div>
    <div className="weather-details"><span><Droplets size={14}/>{weather.current.humidity ?? '—'}% humidity</span><span><Wind size={14}/>{Math.round(weather.current.wind ?? 0)} mph wind</span></div>
    <div className="weather-mini">{weather.days.slice(0,5).map((d,i) => <div key={d.date}><span>{i === 0 ? 'Today' : formatDate(d.date, {weekday:'short'})}</span><WeatherIcon code={d.code} size={20}/><strong>{Math.round(d.high)}°</strong></div>)}</div>
    <button className="weather-footer" onClick={weather.sample ? () => setOpen(true) : onPlan}>{weather.sample ? 'Get weather for your field' : 'Explore your water plan'}<ArrowUpRight size={15}/></button>
  </article>
  {open && <Modal title="Every field has its own forecast." onClose={() => setOpen(false)}><p className="modal-description">Enter a California address or city. City searches use the city center; the forecast is a model estimate for the surrounding area.</p><form className="form-stack" onSubmit={lookup}><label>Farm address or city<input autoFocus required minLength={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="Manteca, CA"/></label>{error && <Notice tone="error">{error}</Notice>}<button className="button primary" disabled={busy}>{busy ? <Spinner label="Finding your forecast…"/> : <><Search size={17}/>Find local weather</>}</button></form><p className="fine-print">Weather by Open-Meteo. Street addresses are resolved by the U.S. Census Geocoder.</p></Modal>}</>;
}
