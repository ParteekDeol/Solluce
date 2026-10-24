import { useState } from 'react';
import { CROPS, SOILS, IRRIGATION, STAGES, FieldSchema } from '../../shared/schema';
import { Modal, Notice, Spinner } from './ui';
import { Plus } from 'lucide-react';
import { hasCoordinates } from '../../shared/location';
export const blankField = { name: '', crop: 'Tomatoes', customCrop: '', soil: 'Sandy loam', irrigation: 'Drip irrigation', stage: 'Not sure', acres: 1, address: '' };
export function FieldInputs({ field, setField }) {
  const [locationMode, setLocationMode] = useState(hasCoordinates(field) ? 'coordinates' : 'address');
  const set = (key, value) => setField(prev => { const next = {...prev}; if (value === undefined) delete next[key]; else next[key] = value; return next; });
  const chooseLocation = mode => {
    setLocationMode(mode);
    setField(prev => mode === 'coordinates'
      ? { ...prev, address: '' }
      : (() => { const { latitude, longitude, ...rest } = prev; return rest; })());
  };
  return <div className="form-grid">
    <label className="span-two">Field name<input required minLength={2} maxLength={80} value={field.name} onChange={e => set('name', e.target.value)} placeholder="e.g. North tomato plot"/></label>
    <label>Crop type<select value={field.crop} onChange={e => setField(prev=>({...prev,crop:e.target.value,customCrop:e.target.value==='Other'?prev.customCrop||'':''}))}>{CROPS.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
    {field.crop==='Other'&&<label className="span-two">Which crop?<input required minLength={2} maxLength={80} value={field.customCrop||''} onChange={e=>set('customCrop',e.target.value)} placeholder="e.g. Bell peppers" autoComplete="off"/></label>}
    <label>Soil type<select value={field.soil} onChange={e => set('soil', e.target.value)}>{SOILS.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
    <label>Irrigation system<select value={field.irrigation} onChange={e => set('irrigation', e.target.value)}>{IRRIGATION.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
    <label>Growth stage<select value={field.stage} onChange={e => set('stage', e.target.value)}>{STAGES.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
    <label>Field size <span className="label-unit">acres</span><input type="number" required min="0.01" max="10000" step="0.01" value={field.acres} onChange={e => set('acres', e.target.value === '' ? '' : Number(e.target.value))}/></label>
    <div className="span-two location-entry"><span className="location-entry-label">Field location</span><div className="location-tabs" role="group" aria-label="Location entry method"><button type="button" className={locationMode==='address'?'selected':''} aria-pressed={locationMode==='address'} onClick={()=>chooseLocation('address')}>Address or city</button><button type="button" className={locationMode==='coordinates'?'selected':''} aria-pressed={locationMode==='coordinates'} onClick={()=>chooseLocation('coordinates')}>Latitude / longitude</button></div>
      {locationMode==='address' ? <label>Farm address or California city<input required minLength={2} maxLength={200} value={field.address} onChange={e => set('address', e.target.value)} placeholder="e.g. Manteca, CA" autoComplete="street-address"/></label> : <div className="coordinate-grid"><label>Latitude <span className="label-unit">32 to 42.1° N</span><input required type="number" inputMode="decimal" min="32" max="42.1" step="any" value={field.latitude ?? ''} onChange={e=>set('latitude',e.target.value===''?undefined:Number(e.target.value))} placeholder="37.7974"/></label><label>Longitude <span className="label-unit">−124.6 to −114°</span><input required type="number" inputMode="decimal" min="-124.6" max="-114" step="any" value={field.longitude ?? ''} onChange={e=>set('longitude',e.target.value===''?undefined:Number(e.target.value))} placeholder="-121.2160"/></label></div>}
      <small>Enter coordinates when your field has no street address. Weather uses the point you provide.</small>
    </div>
  </div>;
}
export default function FieldModal({ initial, onSave, onClose }) {
  const [field, setField] = useState(initial || blankField);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const parsed = FieldSchema.safeParse(field);
    if (!parsed.success) { setError('Check the field details, location and positive acreage.'); return; }
    setBusy(true); setError('');
    try { await onSave({ ...parsed.data, ...(initial?.id ? {id: initial.id} : {}) }); onClose(); }
    catch { setError('The field could not be saved. Check your connection and Firebase permissions.'); }
    finally { setBusy(false); }
  }
  return <Modal wide title={initial ? 'A few field details.' : 'Make room for a new field.'} onClose={onClose}><p className="modal-description">A little context helps Solluce make your next crop check more useful.</p><form className="form-stack" onSubmit={submit}><FieldInputs field={field} setField={setField}/>{error && <Notice tone="error">{error}</Notice>}<button className="button primary" disabled={busy}>{busy ? <Spinner label="Saving field…"/> : <><Plus size={17}/>Save field</>}</button></form></Modal>;
}
