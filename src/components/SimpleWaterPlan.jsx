import { useMemo, useState } from 'react';
import { ArrowRight, CloudRain, Droplets, Info, MapPin, Sun, Thermometer, Wind } from 'lucide-react';
import { waterBudget, irrigationRuntime, EFFICIENCIES } from '../../shared/water';
import { hasCoordinates, weatherQuery } from '../../shared/location';
import { request } from '../lib/api';
import { formatDate, formatNumber, Notice, Spinner, WeatherIcon, weatherLabel } from './ui';
import LocationSearchFields from './LocationSearchFields';
import ForecastExplorer from './ForecastExplorer';
import { readPreferences } from '../lib/preferences';

export default function SimpleWaterPlan({ weather, field, onWeather }) {
  const spanish = readPreferences().language === 'es';
  const [acres, setAcres] = useState(field.acres);
  const [coefficient, setCoefficient] = useState(.85);
  const [efficiency, setEfficiency] = useState(EFFICIENCIES[field.irrigation] || .75);
  const [active, setActive] = useState(0);
  const [view, setView] = useState('plan');
  const [moisture, setMoisture] = useState('unknown');
  const [flow, setFlow] = useState('');
  const [locationInput, setLocationInput] = useState(hasCoordinates(field) ? {address:'',latitude:field.latitude,longitude:field.longitude} : {address:field.address || weather?.location.name || ''});
  const [locationMode, setLocationMode] = useState(hasCoordinates(field) ? 'coordinates' : 'address');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const budget = useMemo(() => waterBudget(weather?.days, Number(acres), Number(coefficient), Number(efficiency)), [weather, acres, coefficient, efficiency]);
  const day = budget?.rows[active];
  const runtime = irrigationRuntime(day?.gallons, Number(flow));
  const max = Math.max(1, ...(budget?.rows.map(row => row.gross) || []));
  const oldForecast = weather && !weather.sample && weather.days?.[0]?.date < new Date().toLocaleDateString('en-CA', {timeZone:'America/Los_Angeles'});

  async function loadWeather(event) {
    event.preventDefault(); setBusy(true); setError('');
    const details = event.currentTarget.closest('details');
    try { onWeather(await request('/api/weather?' + weatherQuery(locationInput))); setActive(0); details?.removeAttribute('open'); }
    catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  const today = weather?.days?.[0];
  const current = weather?.current;
  const weatherCode = current?.code ?? today?.code;
  const displayNumber = (value, unit = '') => Number.isFinite(value) ? `${Math.round(value)}${unit}` : '—';

  return <div className="simple-water">
    <header><p className="simple-kicker">Water planner</p><h1>{view === 'weather' ? 'Your local weather.' : 'Plan your next watering.'}</h1><p>{view === 'weather' ? 'Today’s temperature, rain, wind, and the seven-day forecast.' : 'See a forecast-based starting estimate, then check your soil before irrigating.'}</p></header>
    <div className="simple-water-tabs" role="tablist" aria-label="Water and weather views">
      <button id="water-plan-tab" role="tab" aria-controls="water-plan-panel" aria-selected={view === 'plan'} onClick={() => setView('plan')}><Droplets size={19}/>Water plan</button>
      <button id="water-weather-tab" role="tab" aria-controls="water-weather-panel" aria-selected={view === 'weather'} onClick={() => setView('weather')}><Sun size={19}/>Weather</button>
    </div>
    {weather?.sample && <p className="simple-sample-note">Showing sample weather. Add your location before using this for your field.</p>}
    {view === 'plan' && field?.sample && !weather?.sample && <p className="simple-sample-note">The forecast is live, but the field settings are still an example. Adjust the acreage below.</p>}
    {oldForecast && <p className="simple-sample-note">This forecast is out of date. Load local weather again before planning irrigation.</p>}
    <div className="simple-water-location"><MapPin size={18}/><span>Forecast for <strong>{weather?.location.name || 'No location selected'}</strong></span></div>
    <details className="simple-details simple-location"><summary><MapPin size={17}/>Change forecast location<ArrowRight size={17}/></summary><form onSubmit={loadWeather}><LocationSearchFields value={locationInput} onChange={setLocationInput} mode={locationMode} onModeChange={setLocationMode} prefix="simple-water"/><button className="button primary" disabled={busy}>{busy ? <Spinner label="Loading forecast…"/> : 'Use this location'}</button>{error && <Notice tone="error">{error}</Notice>}</form></details>
    {view === 'weather' ? <div id="water-weather-panel" role="tabpanel" aria-labelledby="water-weather-tab" className="simple-weather-tab">
      {weather?.days?.length ? <>
        <section className="simple-weather-current" aria-label="Current conditions">
          <div className="simple-weather-current-main">{Number.isFinite(weatherCode) && <WeatherIcon code={weatherCode} size={48}/>}<div><span>Current forecast</span><strong>{displayNumber(current?.temperature, '°F')}</strong><p>{Number.isFinite(weatherCode) ? weatherLabel(weatherCode) : 'Condition unavailable'}</p></div></div>
          <div className="simple-weather-current-details"><span><Droplets size={18}/>Humidity <strong>{displayNumber(current?.humidity, '%')}</strong></span><span><Wind size={18}/>Wind <strong>{displayNumber(current?.wind, ' mph')}</strong></span></div>
        </section>
        <div className="simple-weather-today"><div><Thermometer size={20}/><span>Today’s high / low</span><strong>{displayNumber(today?.high, '°')} / {displayNumber(today?.low, '°')}</strong></div><div><CloudRain size={20}/><span>Chance of rain</span><strong>{displayNumber(today?.rainChance, '%')}</strong></div><div><Sun size={20}/><span>Sunshine</span><strong>{Number.isFinite(today?.sunshineHours) ? `${today.sunshineHours.toFixed(1)} hr` : '—'}</strong></div></div>
        <ForecastExplorer key={`${weather.location.name}-${weather.fetchedAt || ''}`} weather={weather}/>
      </> : <Notice>Load a forecast to see local weather.</Notice>}
    </div> : <div id="water-plan-panel" role="tabpanel" aria-labelledby="water-plan-tab">
    {field?.irrigation === 'Rain-fed' && <p className="simple-sample-note">This field is rain-fed. The estimate shows possible supplemental water need, not a scheduled irrigation.</p>}
    <div className="simple-water-setup"><label>Field size <span>acres</span><input type="number" min=".01" max="10000" step=".01" value={acres} onChange={event => setAcres(event.target.value)}/></label></div>
    {budget ? <>
      <section className="simple-water-total"><span>Estimated irrigation for the next 7 days</span><strong>{formatNumber(budget.gallons)} <small>gallons</small></strong><p>{spanish ? `Esta es una estimación para ${acres} acres, no una orden de riego. La lluvia puede cambiarla.` : `This is a planning estimate for ${acres} acres, not a watering order. Rain may change it.`}</p></section>
      <section className="simple-water-week"><div className="simple-section-head"><h2>Day by day</h2><span>Tap a day</span></div><div className="simple-water-bars" aria-label={spanish?'Riego estimado por día':'Estimated irrigation by day'}>{budget.rows.map((row, index) => <button key={row.date} className={index === active ? 'selected' : ''} aria-pressed={index === active} aria-label={`${formatDate(row.date)}: ${row.gross.toFixed(1)} ${spanish?'milímetros de riego estimado':'millimeters estimated irrigation'}`} onClick={() => setActive(index)}><span className="simple-water-bar-track"><span style={{height:Math.max(5, row.gross / max * 100) + '%', background:row.precipitation > 1 ? '#69a8be' : row.gross > max * .7 ? '#d58d62' : '#8bab70'}}/></span><strong>{formatDate(row.date, {weekday:'short'})}</strong><small>{row.gross.toFixed(1)} mm</small></button>)}</div>
      {day && <div className="simple-water-day"><div><WeatherIcon code={day.code} size={30}/><h3>{formatDate(day.date, {weekday:'long',month:'short',day:'numeric'})}</h3></div><p><strong>{formatNumber(day.gallons)} {spanish?'galones':'gallons'}</strong> {spanish?`estimados para este día · ${day.precipitation.toFixed(1)} mm de lluvia pronosticada`:`estimated for this day · ${day.precipitation.toFixed(1)} mm forecast rain`}</p><label>How does the root-zone soil feel?<select value={moisture} onChange={event => setMoisture(event.target.value)}><option value="unknown">I haven’t checked</option><option value="dry">Dry</option><option value="moist">Moist</option><option value="saturated">Saturated</option></select></label><p className="simple-water-advice">{moisture === 'saturated' ? 'Wait to water. The root zone is saturated; check again tomorrow.' : moisture === 'moist' ? 'Check whether water is needed before irrigating.' : day.precipitation > 1 ? 'Rain is forecast. Check soil moisture after rain before irrigating.' : 'Check soil moisture in several spots before deciding to irrigate.'}</p></div>}
      </section>
      <details className="simple-details simple-water-more"><summary>Improve this estimate with field measurements<ArrowRight size={18}/></summary><div className="simple-water-advanced"><label>Measured system flow <span>gallons per hour</span><input type="number" min="0" inputMode="decimal" value={flow} onChange={event => setFlow(event.target.value)} placeholder="e.g. 10000"/></label>{runtime !== null && <p><strong>Estimated run time for this day:</strong> {runtime >= 1 ? `${runtime.toFixed(1)} ${spanish?'horas':'hours'}` : `${Math.round(runtime * 60)} ${spanish?'minutos':'minutes'}`}. {spanish?`Esto supone que el caudal medido riega las ${acres} acres de manera uniforme.`:`This assumes the measured flow serves the full ${acres} acres evenly.`}</p>}<label>Crop coefficient <span>starting value 0.85</span><input type="number" min=".2" max="1.3" step=".05" value={coefficient} onChange={event => setCoefficient(event.target.value)}/></label><label>Application efficiency<select value={efficiency} onChange={event => setEfficiency(Number(event.target.value))}><option value=".9">Drip · 90% assumed</option><option value=".85">Micro-sprinkler · 85% assumed</option><option value=".75">Sprinkler or unknown · 75% assumed</option><option value=".7">Hand watering · 70% assumed</option><option value=".6">Furrow · 60% assumed</option><option value=".55">Flood · 55% assumed</option></select></label></div></details>
      <details className="simple-details simple-water-data"><summary>See the numbers behind this estimate<ArrowRight size={18}/></summary><div className="data-table-scroll"><table className="data-table"><caption>{spanish?`Estimaciones diarias del modelo para ${acres} acres`:`Daily model estimates for ${acres} acres`}</caption><thead><tr><th>Date</th><th>Crop demand (mm)</th><th>Useful rain (mm)</th><th>Apply (mm)</th><th>Volume (gal)</th></tr></thead><tbody>{budget.rows.map(row => <tr key={row.date}><th>{formatDate(row.date)}</th><td>{row.cropDemand.toFixed(1)}</td><td>{row.effectiveRain.toFixed(1)}</td><td>{row.gross.toFixed(1)}</td><td>{formatNumber(row.gallons)}</td></tr>)}</tbody></table></div><p className="simple-method">Crop demand = forecast ET₀ × crop coefficient. Useful rain is assumed to be 80% of forecast rain. Divide the remaining need by application efficiency to estimate irrigation depth.</p></details>
    </> : <Notice>Enter a valid field size and load a forecast to see an estimate.</Notice>}
    <p className="simple-water-caution"><Info size={18}/>Actual needs depend on soil, roots, runoff, and your irrigation system. Confirm with field measurements before watering.</p>
    </div>}
  </div>;
}
