export default function LocationSearchFields({ value, onChange, mode, onModeChange, prefix }) {
  const changeMode = next => {
    onModeChange(next);
    onChange({ address: '', latitude: undefined, longitude: undefined });
  };
  return <div className="location-entry">
    <span className="location-entry-label">Forecast location</span>
    <div className="location-tabs" role="group" aria-label="Forecast location entry method"><button type="button" className={mode==='address'?'selected':''} aria-pressed={mode==='address'} onClick={()=>changeMode('address')}>Address or city</button><button type="button" className={mode==='coordinates'?'selected':''} aria-pressed={mode==='coordinates'} onClick={()=>changeMode('coordinates')}>Latitude / longitude</button></div>
    {mode==='coordinates' ? <div className="coordinate-grid"><label htmlFor={prefix+'-latitude'}>Latitude<input id={prefix+'-latitude'} required type="number" inputMode="decimal" min="32" max="42.1" step="any" placeholder="37.7974" value={value.latitude ?? ''} onChange={e=>onChange({...value,latitude:e.target.value===''?undefined:Number(e.target.value)})}/></label><label htmlFor={prefix+'-longitude'}>Longitude<input id={prefix+'-longitude'} required type="number" inputMode="decimal" min="-124.6" max="-114" step="any" placeholder="-121.2160" value={value.longitude ?? ''} onChange={e=>onChange({...value,longitude:e.target.value===''?undefined:Number(e.target.value)})}/></label></div> : <label htmlFor={prefix+'-address'}>Farm address or California city<input id={prefix+'-address'} required minLength={2} maxLength={200} placeholder="Manteca, CA" value={value.address || ''} onChange={e=>onChange({...value,address:e.target.value})}/></label>}
    <small>{mode==='coordinates' ? 'The forecast uses the exact point you enter.' : 'City searches use the city center.'}</small>
  </div>;
}
