import { useRef, useState } from 'react';
import { CloudRain, Droplets, Sun, Thermometer, Table2 } from 'lucide-react';
import { formatDate } from './ui';

const metrics = [
  {id:'temperature',label:'Temperature',unit:'°F',color:'#d36d48',icon:Thermometer},
  {id:'rain',label:'Rain',unit:'mm',color:'#4f91b5',icon:CloudRain},
  {id:'sunshine',label:'Sunshine',unit:'hr',color:'#d6a640',icon:Sun},
  {id:'evaporation',label:'Water demand',unit:'mm',color:'#679b6e',icon:Droplets},
];
const highValue=(day,metric)=>metric==='temperature'?day.high:metric==='rain'?day.precipitation:metric==='sunshine'?day.sunshineHours:day.et0;
const number=value=>Number.isFinite(value)?value.toFixed(1):'—';

export default function ForecastExplorer({weather, compact=false}) {
  const [metric,setMetric]=useState('temperature');
  const [selected,setSelected]=useState(0);
  const [showTable,setShowTable]=useState(false);
  const chartRef=useRef(null);
  const days=weather?.days?.slice(0,7) || [];
  if (!days.length) return null;
  const option=metrics.find(item=>item.id===metric);
  const values=days.map(day=>highValue(day,metric));
  const lows=metric==='temperature'?days.map(day=>day.low):[];
  const valid=[...values,...lows].filter(Number.isFinite);
  const chartComplete=values.every(Number.isFinite) && lows.every(Number.isFinite);
  const min=metric==='temperature'&&valid.length?Math.floor((Math.min(...valid)-5)/10)*10:0;
  const max=metric==='temperature'&&valid.length?Math.ceil((Math.max(...valid)+5)/10)*10:Math.max(1,...valid.map(value=>Math.ceil(value*1.2)));
  const range=Math.max(1,max-min);
  const x=i=>48+i*100;
  const y=value=>177-(value-min)/range*135;
  const path=series=>series.map((value,i)=>`${i?'L':'M'} ${x(i)} ${y(Number.isFinite(value)?value:min)}`).join(' ');
  const active=days[selected] || days[0];
  const selectDay=index=>{
    setSelected(index);
    const chart=chartRef.current;
    if(chart)chart.scrollTo({left:index/6*(chart.scrollWidth-chart.clientWidth),behavior:'smooth'});
  };
  return <section className={'panel forecast-explorer '+(compact?'compact':'')} aria-label="Interactive seven-day weather trends">
    <div className="forecast-heading"><div><p className="eyebrow">7-DAY FORECAST EXPLORER</p><h2>See the week ahead.</h2><p>Choose a measure, then a day to inspect the forecast.</p></div><span className={'forecast-source '+(weather.sample?'sample':'live')}>{weather.sample?'Illustrative weather':'Live Open-Meteo forecast'}</span></div>
    <div className="forecast-metrics" role="group" aria-label="Forecast measure">{metrics.map(item=><button key={item.id} className={metric===item.id?'selected':''} style={{'--metric-color':item.color}} aria-pressed={metric===item.id} onClick={()=>setMetric(item.id)}><item.icon size={18}/>{item.label}</button>)}</div>
    <div className="forecast-chart-legend"><span><i style={{background:option.color}}/>{metric==='temperature'?'Daily high':option.label} ({option.unit})</span>{metric==='temperature'&&<span><i style={{background:'#7f9bbb'}}/>Daily low (°F)</span>}</div>
    {chartComplete?<div className="forecast-chart-wrap" ref={chartRef}><svg className="forecast-svg" viewBox="0 0 700 210" role="img" aria-label={`${option.label} by day for ${weather.location.name}. Selected ${formatDate(active.date)}.`}>
      <defs><linearGradient id="forecast-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={option.color} stopOpacity=".25"/><stop offset="1" stopColor={option.color} stopOpacity=".02"/></linearGradient></defs>
      {[0,1,2,3].map(i=><g key={i}><line className="forecast-gridline" x1="40" x2="660" y1={42+i*45} y2={42+i*45}/><text className="forecast-axis" x="6" y={47+i*45}>{number(max-i*range/3)}</text></g>)}
      <rect x={x(selected)-32} y="30" width="64" height="164" rx="9" fill={option.color} opacity=".09"/>
      {metric==='rain'||metric==='sunshine'?values.map((value,i)=><rect key={i} x={x(i)-17} y={y(Number.isFinite(value)?value:0)} width="34" height={Math.max(0,177-y(Number.isFinite(value)?value:0))} rx="6" fill={option.color} opacity={i===selected?1:.66}/>):<>
        <path d={`${path(values)} L ${x(6)} 177 L ${x(0)} 177 Z`} fill="url(#forecast-fill)"/>
        {metric==='temperature'&&<path d={path(lows)} fill="none" stroke="#7f9bbb" strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round"/>}
        <path d={path(values)} fill="none" stroke={option.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        {values.map((value,i)=><circle key={i} cx={x(i)} cy={y(Number.isFinite(value)?value:min)} r={i===selected?7:5} fill={option.color} stroke="white" strokeWidth="2"/>)}
      </>}
      {days.map((day,i)=><text key={day.date} className="forecast-axis day" x={x(i)} y="205" textAnchor="middle">{formatDate(day.date,{weekday:'short'})}</text>)}
    </svg></div>:<p className="forecast-missing">Some {option.label.toLowerCase()} forecast values are unavailable, so this graph is hidden.</p>}<p className="forecast-swipe">Choose a day below to follow it across the chart.</p>
    <div className="forecast-day-buttons" role="group" aria-label="Choose forecast day">{days.map((day,i)=><button key={day.date} className={i===selected?'selected':''} aria-pressed={i===selected} onClick={()=>selectDay(i)}>{formatDate(day.date,{weekday:'short'})}<strong>{metric==='temperature'?`${Math.round(day.high)}°`:number(highValue(day,metric))}</strong></button>)}</div>
    <div className="forecast-selected"><div><span>SELECTED DAY</span><strong>{formatDate(active.date,{weekday:'long',month:'short',day:'numeric'})}</strong></div><div><span>{option.label.toUpperCase()}</span><strong>{metric==='temperature'?`${number(active.high)}° / ${number(active.low)}°`:`${number(highValue(active,metric))} ${option.unit}`}</strong></div><div><span>RAIN CHANCE</span><strong>{Math.round(active.rainChance ?? 0)}%</strong></div><div><span>FORECAST RAIN</span><strong>{number(active.precipitation)} mm</strong></div></div>
    <p className="forecast-footnote">{metric==='evaporation'?'Water demand shows reference evapotranspiration (ET₀), not a field-specific irrigation order.':metric==='rain'?'Rainfall is a forecast total; the amount that reaches roots can differ.':metric==='sunshine'?'Sunshine is the forecast duration of direct sunlight.':'High and low air temperatures are daily model forecasts.'}</p>
    <button className="data-table-toggle" aria-expanded={showTable} onClick={()=>setShowTable(!showTable)}><Table2 size={17}/>{showTable?'Hide data table':'Show data table'}</button>
    {showTable&&<div className="data-table-scroll"><table className="data-table"><caption>Seven-day forecast for {weather.location.name}. Values are model estimates.</caption><thead><tr><th scope="col">Date</th><th scope="col">High (°F)</th><th scope="col">Low (°F)</th><th scope="col">Rain (mm)</th><th scope="col">Sun (hr)</th><th scope="col">ET₀ (mm)</th></tr></thead><tbody>{days.map(day=><tr key={day.date}><th scope="row">{formatDate(day.date,{weekday:'short',month:'short',day:'numeric'})}</th><td>{number(day.high)}</td><td>{number(day.low)}</td><td>{number(day.precipitation)}</td><td>{number(day.sunshineHours)}</td><td>{number(day.et0)}</td></tr>)}</tbody></table></div>}
  </section>;
}
