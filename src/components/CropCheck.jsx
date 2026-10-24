import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X, ArrowRight, ArrowLeft, Leaf, MapPin, Check, ScanLine, CloudSun, Sparkles, ShieldCheck, ImagePlus, CheckCircle2 } from 'lucide-react';
import { PageHeading, Badge, Notice, Spinner, WeatherIcon } from './ui';
import { FieldInputs, blankField } from './FieldForm';
import { FieldSchema } from '../../shared/schema';
import { request, preparePhoto } from '../lib/api';

function Challenge({ onToken, resetKey }) {
  const ref = useRef(null);
  useEffect(() => {
    const key = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    if (!key) return;
    let widget; let disposed = false;
    const render = () => { if (!disposed && window.turnstile && ref.current) widget = window.turnstile.render(ref.current, { sitekey: key, callback: onToken, 'expired-callback': () => onToken(''), 'error-callback': () => onToken(''), theme: 'light' }); };
    let script = document.querySelector('script[data-turnstile]');
    if (window.turnstile) render();
    else {
      if (!script) { script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true; script.dataset.turnstile = 'true'; document.head.appendChild(script); }
      script.addEventListener('load', render);
    }
    return () => { disposed = true; script?.removeEventListener('load', render); if (widget !== undefined && window.turnstile) window.turnstile.remove(widget); };
  }, [resetKey, onToken]);
  return <div ref={ref} className="challenge"/>;
}
export default function CropCheck({ fields, initialField, user, configured, onComplete, onSample, onAuth }) {
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [field, setField] = useState(initialField || { ...blankField });
  const [fieldId, setFieldId] = useState(initialField?.id || '');
  const [quality, setQuality] = useState('Some concerns');
  const [concerns, setConcerns] = useState('');
  const [weather, setWeather] = useState(null);
  const [confirmedAddress, setConfirmedAddress] = useState('');
  const [skipWeather, setSkipWeather] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [token, setToken] = useState('');
  const [challengeReset, setChallengeReset] = useState(0);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const stepRef = useRef(null);
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  useEffect(() => { if (!busy) return; const id = setInterval(() => setProgress(p => Math.min(p + 1, 3)), 7000); return () => clearInterval(id); }, [busy]);
  const confirmed = weather && confirmedAddress === field.address;
  async function addPhotos(files) {
    setError('');
    if (photos.length + files.length > 3) { setError('Choose up to 3 photos per check.'); return; }
    setUploading(true);
    try { const additions = await Promise.all(Array.from(files).map(preparePhoto)); setPhotos(prev => [...prev, ...additions].slice(0,3)); }
    catch (err) { setError(err.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; if (cameraRef.current) cameraRef.current.value = ''; }
  }
  async function locate() {
    setLocating(true); setError('');
    try { const result = await request('/api/weather?address=' + encodeURIComponent(field.address)); setWeather(result); setConfirmedAddress(field.address); setSkipWeather(false); }
    catch (err) { setError(err.message); } finally { setLocating(false); }
  }
  function next(e) {
    e.preventDefault(); setError('');
    if (step === 0 && !photos.length) { setError('Add at least one crop photo to continue, or explore the sample report.'); return; }
    if (step === 1) {
      if (!FieldSchema.safeParse(field).success) { setError('Please complete your field details with a valid acreage.'); return; }
      if (concerns.trim().length < 10) { setError('Tell us a little more about what you are seeing (at least 10 characters).'); return; }
      if (!confirmed && !skipWeather) { setError('Find and confirm your forecast, or choose to continue without weather.'); return; }
    }
    setStep(step + 1);
    requestAnimationFrame(() => stepRef.current?.focus());
  }
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true); setProgress(0);
    try {
      const result = await request('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: FieldSchema.parse(field), quality, concerns, location: confirmed ? weather.location : null, photos: photos.map(({data, mimeType}) => ({data, mimeType})), turnstileToken: token }),
      });
      if (live.current) await onComplete(result, photos.map(p => p.preview), fieldId);
    } catch (err) { if (live.current) setError(err.message); }
    finally { if (live.current) { setBusy(false); setToken(''); setChallengeReset(n=>n+1); } }
  }
  if (busy) return <div className="analysis-loading"><div className="scan-visual">{photos[0] && <img src={photos[0].preview} alt="Crop being reviewed"/>}<div className="scan-line"/><ScanLine size={45}/></div><p className="eyebrow">A CLOSER LOOK AT YOUR FIELD</p><h1>Connecting the dots.</h1><p>Your photos, field conditions, and local weather.<br/>One practical plan to help you move forward.</p><div className="analysis-stages">{['Preparing your crop photos','Reading visible crop signals','Considering field conditions','Putting your next steps together'].map((label,i) => <span className={i<=progress ? 'active' : ''} key={label}>{i<progress ? <Check size={15}/> : i===progress ? <span className="small-pulse"/> : <span className="small-circle"/>}{label}</span>)}</div><p className="fine-print">Most checks take about a minute. Keep this page open.</p></div>;
  return <>
    <PageHeading eyebrow="A LITTLE CONTEXT. A LOT MORE CLARITY." title="Let’s take a closer look." description="Turn what you’re seeing in the field into a useful next step." action={<button className="button secondary" onClick={onSample}>Explore a sample<ArrowRight size={16}/></button>}/>
    {configured === false && <div className="setup-banner"><Sparkles size={17}/><span>Live AI is being connected. You can prepare a crop check or explore the complete sample report.</span><button onClick={onSample}>See sample<ArrowRight size={15}/></button></div>}
    <div className="check-layout"><section className="check-card">
      <div className="stepper" aria-label="Crop check progress">{['Crop photos','Field context','Review & analyze'].map((title,i) => <div className={step===i ? 'active' : step>i ? 'complete' : ''} key={title}><span>{step>i ? <Check size={15}/> : '0'+(i+1)}</span><p>{title}</p>{i<2 && <i/>}</div>)}</div>
      <form onSubmit={step < 2 ? next : submit}>
        <div className="step-content">
          <h2 ref={stepRef} tabIndex={-1}>{['A photo tells the first part of the story.','Now, tell us about your field.','A good plan starts with good context.'][step]}</h2>
          <p className="muted">{['Add a close-up of an affected leaf and a wider shot of the plant.','Details help distinguish look-alike symptoms and make advice useful.','Review the details below before sending your crop check.'][step]}</p>
          {step === 0 && <>
            <input ref={fileRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => addPhotos(e.target.files)} aria-label="Upload crop photos"/>
            <input ref={cameraRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={e => addPhotos(e.target.files)} aria-label="Take a crop photo"/>
            <div className={'dropzone ' + (dragging ? 'dragging' : '')} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);if(!uploading)addPhotos(e.dataTransfer.files);}}>
              <div className="upload-icon"><ScanLine size={34} strokeWidth={1.4}/><span><Leaf size={15}/></span></div>
              <h3>Let your crops do the talking.</h3><p>Drop your photos here, or choose them below.</p>
              <div className="upload-actions"><button type="button" className="button primary" disabled={uploading || photos.length>=3} onClick={()=>fileRef.current.click()}><Upload size={16}/>Choose photos</button><button type="button" className="button secondary" disabled={uploading || photos.length>=3} onClick={()=>cameraRef.current.click()}><Camera size={17}/>Take a photo</button></div>
              <span className="fine-print">JPEG, PNG or WebP · Up to 3 photos · 12 MB each</span>
            </div>
            {uploading && <Spinner label="Preparing your photos…"/>}
            {photos.length > 0 && <div className="photo-grid">{photos.map((photo,i)=><div className="photo-tile" key={i}><img src={photo.preview} alt={'Uploaded crop photo '+(i+1)}/><button type="button" className="photo-remove" aria-label={'Remove photo '+(i+1)} onClick={()=>setPhotos(photos.filter((_,j)=>j!==i))}><X size={14}/></button><span>{i===0?'Main photo':'Supporting photo'}</span></div>)}</div>}
            <div className="privacy-note"><ShieldCheck size={18}/><p>Your photos are resized on your device and sent to Gemini for analysis. Solluce doesn’t store the original photos.</p></div>
          </>}
          {step === 1 && <>
            {fields.length>0 && <label className="saved-field-select">Start with a saved field<select value={fieldId} onChange={e=>{const selected=fields.find(f=>f.id===e.target.value);setFieldId(e.target.value);setField(selected || {...blankField});setWeather(null);}}><option value="">Enter a new field</option>{fields.map(f=><option value={f.id} key={f.id}>{f.name}</option>)}</select></label>}
            <FieldInputs field={field} setField={setField}/>
            <div className="location-check"><button type="button" className="button secondary" disabled={locating || field.address.length<2} onClick={locate}>{locating ? <Spinner label="Finding forecast…"/> : <><MapPin size={16}/>{confirmed ? 'Refresh local weather' : 'Find local weather'}</>}</button>{confirmed && <div className="location-confirmed"><CheckCircle2 size={18}/><span><strong>{weather.location.name}</strong><small>{weather.location.precision==='city'?'City center forecast':'Address matched'} · {Math.round(weather.current.temperature)}°F · 7-day forecast ready</small></span></div>}</div>
            {!confirmed && <label className="checkbox-label"><input type="checkbox" checked={skipWeather} onChange={e=>setSkipWeather(e.target.checked)}/>Continue without weather if my location cannot be resolved</label>}
            <div className="form-grid condition-fields"><label>How are your crops looking?<select value={quality} onChange={e=>setQuality(e.target.value)}>{['Looking healthy','Some concerns','Needs attention','Severe decline'].map(q=><option key={q}>{q}</option>)}</select></label><label className="span-two">What have you noticed?<textarea required minLength={10} maxLength={2000} rows={4} value={concerns} onChange={e=>setConcerns(e.target.value)} placeholder="e.g. Lower leaves started yellowing last week. A few plants wilt in the afternoon. We irrigate for 30 minutes each morning."/></label></div>
          </>}
          {step === 2 && <><div className="review-summary"><div className="review-photos">{photos.map((p,i)=><img key={i} src={p.preview} alt={'Crop photo '+(i+1)}/>)}</div><div><Badge>{field.crop}</Badge><h3>{field.name}</h3><p><MapPin size={14}/>{field.address}</p><div className="review-tags"><span>{field.acres} acres</span><span>{field.soil}</span><span>{field.irrigation}</span></div></div></div><dl className="review-details"><div><dt>Growth stage</dt><dd>{field.stage}</dd></div><div><dt>Current condition</dt><dd>{quality}</dd></div><div><dt>Your observations</dt><dd>{concerns}</dd></div><div><dt>Weather context</dt><dd>{confirmed ? weather.location.name + ' · live 7-day forecast' : 'Not included'}</dd></div></dl><Notice>AI can suggest possible causes, but a photograph cannot confirm a diagnosis. Your report will include what to check next.</Notice>{!user && <p className="guest-reminder">Your result stays in this session. <button type="button" onClick={onAuth}>Sign in</button> to keep it in your history.</p>}<Challenge onToken={setToken} resetKey={challengeReset}/></>}
          {error && <Notice tone="error">{error}</Notice>}
        </div>
        <div className="step-footer"><button className="button ghost" type="button" disabled={step===0} onClick={()=>{setStep(step-1);setError('');}}><ArrowLeft size={16}/>Back</button><span>Step {step+1} of 3</span><button className="button primary" disabled={uploading || locating || (step===2 && import.meta.env.VITE_TURNSTILE_SITE_KEY && !token)}>{step===2 ? <><Sparkles size={17}/>Analyze my crops</> : <>Continue<ArrowRight size={17}/></>}</button></div>
      </form>
    </section><aside className="check-aside"><span className="aside-icon"><Leaf size={25} strokeWidth={1.5}/></span><p className="eyebrow">BETTER INPUT. BETTER INSIGHT.</p><h3>A good photo<br/>goes a long way.</h3><div className="photo-tip"><span>01</span><div><strong>Get a little closer</strong><p>Fill the frame with the leaf or area you’re concerned about.</p></div></div><div className="photo-tip"><span>02</span><div><strong>Find natural light</strong><p>Soft daylight makes colors and patterns easier to see.</p></div></div><div className="photo-tip"><span>03</span><div><strong>Show the bigger picture</strong><p>Add a second photo of the whole plant and surrounding soil.</p></div></div><div className="aside-bottom"><SunIllustration/><p>A little observation today.<br/>A more resilient farm tomorrow.</p></div></aside></div>
  </>;
}
function SunIllustration(){return <svg viewBox="0 0 180 80" fill="none" aria-hidden="true"><path d="M5 62h170M40 62a50 50 0 0 1 100 0M58 62a32 32 0 0 1 64 0M76 62a14 14 0 0 1 28 0M90 1v7M24 20l8 8M156 20l-8 8M10 40l10 4M170 40l-10 4" stroke="currentColor" strokeWidth="1.3"/><path d="M20 72h140" stroke="currentColor" strokeWidth="1.3"/></svg>;}
