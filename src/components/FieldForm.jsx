import { useState } from 'react';
import { CROPS, SOILS, IRRIGATION, STAGES, FieldSchema } from '../../shared/schema';
import { Modal, Notice, Spinner } from './ui';
import { Plus } from 'lucide-react';
export const blankField = { name: '', crop: 'Tomatoes', soil: 'Sandy loam', irrigation: 'Drip irrigation', stage: 'Not sure', acres: 1, address: '' };
export function FieldInputs({ field, setField }) {
  const set = (key, value) => setField(prev => ({ ...prev, [key]: value }));
  return <div className="form-grid">
    <label className="span-two">Field name<input required minLength={2} maxLength={80} value={field.name} onChange={e => set('name', e.target.value)} placeholder="e.g. North tomato plot"/></label>
    <label>Crop type<select value={field.crop} onChange={e => set('crop', e.target.value)}>{CROPS.map(v => <option key={v}>{v}</option>)}</select></label>
    <label>Soil type<select value={field.soil} onChange={e => set('soil', e.target.value)}>{SOILS.map(v => <option key={v}>{v}</option>)}</select></label>
    <label>Irrigation system<select value={field.irrigation} onChange={e => set('irrigation', e.target.value)}>{IRRIGATION.map(v => <option key={v}>{v}</option>)}</select></label>
    <label>Growth stage<select value={field.stage} onChange={e => set('stage', e.target.value)}>{STAGES.map(v => <option key={v}>{v}</option>)}</select></label>
    <label>Field size <span className="label-unit">acres</span><input type="number" required min="0.01" max="10000" step="0.01" value={field.acres} onChange={e => set('acres', e.target.value === '' ? '' : Number(e.target.value))}/></label>
    <label>Farm address or California city<input required minLength={2} maxLength={200} value={field.address} onChange={e => set('address', e.target.value)} placeholder="e.g. Manteca, CA" autoComplete="street-address"/></label>
  </div>;
}
export default function FieldModal({ initial, onSave, onClose }) {
  const [field, setField] = useState(initial || blankField);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const parsed = FieldSchema.safeParse(field);
    if (!parsed.success) { setError('Check the field details and enter a positive acreage.'); return; }
    setBusy(true); setError('');
    try { await onSave({ ...parsed.data, ...(initial?.id ? {id: initial.id} : {}) }); onClose(); }
    catch { setError('The field could not be saved. Check your connection and Firebase permissions.'); }
    finally { setBusy(false); }
  }
  return <Modal wide title={initial ? 'A few field details.' : 'Make room for a new field.'} onClose={onClose}><p className="modal-description">A little context helps Solluce make your next crop check more useful.</p><form className="form-stack" onSubmit={submit}><FieldInputs field={field} setField={setField}/>{error && <Notice tone="error">{error}</Notice>}<button className="button primary" disabled={busy}>{busy ? <Spinner label="Saving field…"/> : <><Plus size={17}/>Save field</>}</button></form></Modal>;
}
