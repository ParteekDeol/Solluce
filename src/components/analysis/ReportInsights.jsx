import { useState } from 'react';
import { CloudRain, Droplets, Sun, Thermometer } from 'lucide-react';
import { formatDate } from '../ui';
import { readPreferences } from '../../lib/preferences';

const categories = [
  { id:'water', label:'Water', color:'#4e9bb7' },
  { id:'soil', label:'Soil', color:'#b78360' },
  { id:'crop', label:'Crop care', color:'#92a967' },
  { id:'inspection', label:'Field checks', color:'#a17bb3' },
];

const moistureAdvice = {
  unknown:'A photo and forecast cannot measure root-zone moisture. Check several spots near affected and healthy plants.',
  dry:'Dry soil may support a water-stress concern. Check emitter output before changing irrigation.',
  moist:'Moist soil does not rule out other causes of wilting. Compare affected and healthy plants.',
  saturated:'Saturated soil can stress roots. Pause watering and check drainage before adding water.',
};

export default function ReportInsights({ report, weather, field, analysisId }) {
  const spanish = readPreferences().language === 'es';
  const [category, setCategory] = useState(report.recommendations[0]?.category || 'water');
  const [selectedDay, setSelectedDay] = useState(0);
  const [moisture, setMoisture] = useState(() => {try{const saved=sessionStorage.getItem(`solluce-moisture-${analysisId}`);return Object.hasOwn(moistureAdvice,saved)?saved:'unknown';}catch{return 'unknown';}});
  const counts = categories.map(item => ({...item, actions:report.recommendations.filter(action => action.category === item.id)}));
  const maxCount = Math.max(1, ...counts.map(item => item.actions.length));
  const chosen = counts.find(item => item.id === category) || counts[0];
  const days = weather?.days?.slice(0, 7) || [];
  const day = days[selectedDay] || days[0];
  const maxRain = Math.max(1, ...days.map(item => Number.isFinite(item.precipitation) ? item.precipitation : 0));
  const value = (number, unit) => Number.isFinite(number) ? `${Math.round(number)}${unit}` : '—';
  const actionWord = count => spanish ? (count===1?'acción':'acciones') : (count===1?'action':'actions');
  const checkDay = weather?.days?.[0];
  function updateMoisture(value){setMoisture(value);try{sessionStorage.setItem(`solluce-moisture-${analysisId}`,value);}catch{/* Storage may be unavailable. */}}

  return <section className="report-insights" aria-label="Report charts">
    <div className="simple-section-head"><h2>At a glance</h2><span>{spanish?'Datos del informe y del pronóstico':'From this report and forecast'}</span></div>
    <div className="report-conditions">
      <div className="report-condition-temperature"><Thermometer size={23}/><div><span>Air temperature at this crop check</span><strong>{value(weather?.current?.temperature,'°F')}</strong><p>{checkDay ? `${spanish?'Máxima / mínima prevista':'Forecast high / low'}: ${value(checkDay.high,'°F')} / ${value(checkDay.low,'°F')}` : 'No local temperature forecast was included.'}</p></div></div>
      <div className="report-condition-moisture"><Droplets size={23}/><div><span>Soil moisture</span><label>What did you find in the root zone?<select value={moisture} onChange={event=>updateMoisture(event.target.value)}><option value="unknown">Not checked yet</option><option value="dry">Dry</option><option value="moist">Moist</option><option value="saturated">Saturated</option></select></label><p>{moistureAdvice[moisture]}</p><small>{field?.soil && field.soil!=='Not sure' ? `${spanish?'Suelo':'Soil'}: ${field.soil} · ` : ''}Your observation is saved in this tab only; it was not measured from the photo.</small></div></div>
    </div>
    <div className="report-insights-grid">
      <div className="report-insight-card"><h3>Focus of your next steps</h3><p>Number of recommended actions by topic</p>
        <div className="report-focus-chart" role="group" aria-label="Recommended actions by topic">{counts.map(item => <button key={item.id} className={category===item.id?'selected':''} aria-pressed={category===item.id} aria-label={`${item.label}: ${item.actions.length} ${actionWord(item.actions.length)}`} onClick={()=>setCategory(item.id)} style={{'--chart-color':item.color}}><span className="report-focus-track"><span style={{height:`${Math.max(5,item.actions.length/maxCount*100)}%`}}/></span><strong>{item.actions.length}</strong><small>{item.label}</small></button>)}</div>
        <div className="report-chart-detail"><strong>{chosen.label}: {chosen.actions.length} {actionWord(chosen.actions.length)}</strong>{chosen.actions.length?<p>{chosen.actions.map(item=>item.title).join(' · ')}</p>:<p>No actions in this category.</p>}</div>
      </div>
      {days.length>0 && <div className="report-insight-card"><h3>Forecast at this crop check</h3><p>Forecast high temperature and rainfall</p>
        <div className="report-weather-chart" role="group" aria-label="Seven-day temperature and rain forecast">{days.map((item,index)=><button key={item.date} className={selectedDay===index?'selected':''} aria-pressed={selectedDay===index} aria-label={`${formatDate(item.date)}: ${value(item.high,'°F')}, ${Number.isFinite(item.precipitation)?item.precipitation.toFixed(1):'—'} mm ${spanish?'lluvia':'rain'}`} onClick={()=>setSelectedDay(index)}><span className="report-weather-track"><span className="report-weather-heat" style={{height:`${Number.isFinite(item.high)?Math.max(12,Math.min(100,(item.high-35)/75*100)):0}%`}}/><span className="report-weather-rain" style={{height:`${Number.isFinite(item.precipitation)?item.precipitation/maxRain*100:0}%`}}/></span><strong>{formatDate(item.date,{weekday:'short'})}</strong></button>)}</div>
        <div className="report-chart-legend"><span><i className="heat"/>High</span><span><i className="rain"/>Rain</span></div>
        {day && <div className="report-chart-detail"><strong>{formatDate(day.date,{weekday:'long',month:'short',day:'numeric'})}</strong><p><Sun size={16}/>{value(day.high,'°F')} {spanish?'máxima':'high'} · {value(day.low,'°F')} {spanish?'mínima':'low'} <CloudRain size={16}/>{Number.isFinite(day.precipitation)?day.precipitation.toFixed(1):'—'} mm {spanish?'lluvia':'rain'}</p></div>}
        <p className="report-chart-source">{weather.sample?'Example forecast':'Open-Meteo forecast'} · {weather.fetchedAt ? `${formatDate(weather.fetchedAt)} · ` : ''}{weather.location.name}</p>
      </div>}
    </div>
  </section>;
}
