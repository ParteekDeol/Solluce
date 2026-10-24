import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { LayoutGrid, ScanLine, Sprout, Droplets, History, ArrowUpRight, ArrowRight, Plus, MapPin, Leaf, Menu, X, ChevronRight, LogIn, LogOut, BookOpen, Check, CircleHelp, Bell, Edit3, Trash2, Search, CloudSun, ShieldCheck, Camera, Sun, Sparkles, CalendarDays, CheckCircle2, ArrowDownToLine, Settings2 } from 'lucide-react';
import { auth, firebaseReady, subscribeRecords, saveField, removeField, saveAnalysis, saveCompleted, logOut } from './lib/firebase';
import { sampleAnalysis, sampleField, sampleWeather } from './lib/demo';
import { request } from './lib/api';
import { Brand, Badge, PageHeading, SectionTitle, EmptyState, Notice, Modal, TextLink, Spinner, formatDate } from './components/ui';
import AuthModal from './components/AuthModal';
import FieldModal from './components/FieldForm';
import WeatherPanel from './components/WeatherPanel';
import CropCheck from './components/CropCheck';
import Recommendation from './components/Recommendation';
import Report from './components/analysis/SimpleReport';
import WaterPlan from './components/SimpleWaterPlan';
import ForecastExplorer from './components/ForecastExplorer';
import About from './components/About';
import SimpleOverview from './components/SimpleOverview';
import { locationLabel, cropLabel } from '../shared/location';
import { applyPreferences, readPreferences } from './lib/preferences';
import { localizeInterface } from './lib/localize';

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'check', label: 'Crop check', icon: ScanLine },
  { id: 'water', label: 'Water planner', icon: Droplets },
];
const knownPages = ['overview','check','fields','water','history','report','about','guide'];
function currentPage(){const hash=window.location.hash.slice(1);return knownPages.includes(hash)?hash:'overview';}

export default function App() {
  const [page, setPage] = useState(currentPage);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(firebaseReady);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState(readPreferences);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const [fields, setFields] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordError, setRecordError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [weather, setWeather] = useState(sampleWeather);
  const [fieldModal, setFieldModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [initialField, setInitialField] = useState(null);
  const [checkKey, setCheckKey] = useState(0);
  const [configured, setConfigured] = useState(null);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [locallySaved, setLocallySaved] = useState([]);
  const previousUid = useRef(null);
  const mainRef = useRef(null);
  const sidebarRef = useRef(null);
  useEffect(()=>{const media=window.matchMedia('(max-width: 760px)');const change=()=>{setMobile(media.matches);if(!media.matches)setMobileOpen(false);};media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
  useEffect(()=>{
    if(!mobileOpen)return;
    sidebarRef.current?.querySelector('.mobile-close')?.focus();
    const keydown=e=>{
      if(e.key==='Escape'){setMobileOpen(false);document.querySelector('.mobile-menu')?.focus();}
      if(e.key==='Tab'){
        const buttons=[...sidebarRef.current.querySelectorAll('button,a[href]')].filter(el=>el.getClientRects().length);
        const first=buttons[0],last=buttons[buttons.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',keydown);return()=>document.removeEventListener('keydown',keydown);
  },[mobileOpen]);
  useEffect(() => { const handler=()=>{setPage(currentPage());setMobileOpen(false);};window.addEventListener('hashchange',handler);return()=>window.removeEventListener('hashchange',handler); },[]);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[page]);
  useEffect(()=>{document.body.classList.toggle('menu-open',mobileOpen);return()=>document.body.classList.remove('menu-open');},[mobileOpen]);
  useEffect(()=>{
    request('/api/health').then(d=>setConfigured(d.analysisConfigured)).catch(()=>setConfigured(null));
    if(!auth)return;
    return onAuthStateChanged(auth, next=>{
      if(previousUid.current && previousUid.current!==next?.uid){setAnalysis(null);setFields([]);setAnalyses([]);setLocallySaved([]);setWeather(sampleWeather);setInitialField(null);}
      previousUid.current=next?.uid||null;setUser(next);setAuthLoading(false);
    });
  },[]);
  useEffect(()=>{
    setFields([]);setAnalyses([]);setRecordError('');
    if(!user){setRecordsLoading(false);return;}
    setRecordsLoading(true);
    let count=0;const finish=()=>{count++;if(count>=2)setRecordsLoading(false);};
    const error=()=>{setRecordError('Your saved data could not be loaded. Check your connection and Firestore access rules.');setRecordsLoading(false);};
    const a=subscribeRecords(user.uid,'fields',data=>{setFields(data);finish();},error);
    const b=subscribeRecords(user.uid,'analyses',data=>{setAnalyses(data);finish();},error);
    return()=>{a();b();};
  },[user?.uid]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),5000);return()=>clearTimeout(t);},[toast]);
  useEffect(()=>{applyPreferences(preferences);localizeInterface(preferences.language);},[preferences]);
  function updatePreference(key,value){setPreferences(current=>({...current,[key]:value}));}
  function go(next){if(page===next){setMobileOpen(false);return;}window.location.hash=next;setPage(next);setMobileOpen(false);}
  function newCheck(field=null){try{sessionStorage.removeItem('solluce-check-draft');}catch{/* Storage may be unavailable. */}setInitialField(field);setCheckKey(k=>k+1);go('check');}
  function openSample(){setAnalysis(structuredClone(sampleAnalysis));setSaveError('');go('report');}
  function openReport(record){setAnalysis(record);setSaveError('');go('report');}
  const saved = analysis && (locallySaved.includes(analysis.id)||analyses.some(a=>a.id===analysis.id));
  async function persist(record) {
    if(!user||record.sample)return;
    setSaving(true);setSaveError('');
    try {await saveAnalysis(user.uid,record);setLocallySaved(s=>[...s,record.id]);setToast('Your crop check is saved.');}
    catch {setSaveError('This report is still available in your session, but could not be saved to your account. Check your connection and retry.');}
    finally{setSaving(false);}
  }
  async function completeCheck(record, previews, fieldId){
    const full={...record,photoPreviews:previews};
    setAnalysis(full);if(record.weather)setWeather(record.weather);setSaveError('');go('report');
    if(user){
      await persist(full);
      try{await saveField(user.uid,{...record.field,...(fieldId?{id:fieldId}:{})});}
      catch{setToast('Report created. Field details could not be saved; retry from My fields.');}
    }
  }
  async function toggle(index, target=analysis){
    if(!target)return;
    const before=target.completed||[];
    const completed=before.includes(index)?before.filter(i=>i!==index):[...before,index];
    const updated={...target,completed};setAnalysis(updated);
    if(!target.sample&&user&&(locallySaved.includes(target.id)||analyses.some(a=>a.id===target.id))){
      try{await saveCompleted(user.uid,target.id,completed);}
      catch{setAnalysis({...target,completed:before});setToast('Could not save that change. Please try again.');}
    }
  }
  function openWater(record=analysis){if(record?.weather)setWeather(record.weather);go('water');}
  async function signOut(){try{await logOut();setAccountOpen(false);setToast('You’re now browsing as a guest.');go('overview');}catch{setToast('Sign-out failed. Please try again.');}}
  async function deleteField(){setDeleteBusy(true);try{await removeField(user.uid,deleteTarget.id);setDeleteTarget(null);setToast('Field removed. Analysis history is preserved.');}catch{setToast('Could not delete this field. Please try again.');}finally{setDeleteBusy(false);}}
  const current = analysis || analyses[0] || (!user ? sampleAnalysis : null);
  const activeField = current?.field || fields[0] || sampleField;
  const openFields = user ? fields : analysis && !analysis.sample ? [{...analysis.field,id:'guest-field'}] : [sampleField];
  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();mainRef.current?.focus();mainRef.current?.scrollIntoView();}}>Skip to content</a>
    {mobileOpen&&<button className="sidebar-backdrop" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/>}
    <aside ref={sidebarRef} className={'sidebar '+(mobileOpen?'is-open':'')} aria-label="Main navigation" inert={mobile&&!mobileOpen} role={mobile?'dialog':undefined} aria-modal={mobile&&mobileOpen?true:undefined}>
      <a href="#overview" className="brand-link" aria-label="Solluce overview"><Brand/></a><button className="mobile-close icon-button" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}><X size={20}/></button>
      <div className="workspace-label"><span className="workspace-mark"><Sprout size={17}/></span><div><strong>For your farm</strong><span>Central Valley, California</span></div></div>
      <nav>{navigation.map(item=><button key={item.id} className={'nav-item '+((page===item.id||(page==='report'&&item.id==='check'))?'active':'')} aria-current={page===item.id?'page':undefined} onClick={()=>item.id==='check'?newCheck():go(item.id)}><item.icon size={19} strokeWidth={1.6}/><span>{item.label}</span>{item.id==='check'&&<span className="nav-ai">AI</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-secondary"><button className={'nav-item '+(page==='fields'?'active':'')} onClick={()=>go('fields')}><Sprout size={18}/>My fields</button><button className={'nav-item '+(page==='history'?'active':'')} onClick={()=>go('history')}><History size={18}/>Past checks</button><button className={'nav-item '+((page==='about'||page==='guide')?'active':'')} onClick={()=>go('about')}><CircleHelp size={18}/>About Solluce</button></div><button className="nav-item settings-link" onClick={()=>{setMobileOpen(false);setSettingsOpen(true);}}><Settings2 size={18}/><span>Settings</span></button><button className="account-button" onClick={()=>user?setAccountOpen(true):setAuthOpen(true)}><span className="avatar">{user?(user.displayName||user.email||'F').slice(0,1).toUpperCase():<Sprout size={19}/>}</span><span><strong>{authLoading?'Loading account…':user?.displayName||user?.email?.split('@')[0]||'Guest grower'}</strong><small>{user?'Saved to your account':'Sign in to save your work'}</small></span><ChevronRight size={16}/></button></div>
    </aside>
    <div className="main-shell" inert={mobile&&mobileOpen}>
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={()=>setMobileOpen(true)}><Menu size={22}/></button><span className="mobile-brand"><Brand compact/></span></div><div className="topbar-right"><button className="icon-button settings-shortcut" aria-label="Settings" onClick={()=>setSettingsOpen(true)}><Settings2 size={19}/></button></div></header>
      <main id="main-content" className="main-content" ref={mainRef} tabIndex={-1}>
        {recordError&&<Notice tone="error">{recordError}</Notice>}
        {page==='overview'&&<SimpleOverview user={user} fields={openFields} analysis={current} weather={weather} onWeather={setWeather} onCheck={newCheck} onSample={openSample} onFields={()=>go('fields')} onReport={()=>current&&openReport(current)} onWater={()=>go('water')} />}
        {page==='check'&&<CropCheck key={checkKey} fields={fields} initialField={initialField} user={user} configured={configured} onComplete={completeCheck} onSample={openSample} onAuth={()=>setAuthOpen(true)}/>}
        {page==='report'&&(analysis?<Report key={analysis.id} analysis={analysis} onBack={()=>go('overview')} onCheck={()=>newCheck(analysis.sample?null:analysis.field)} onWater={()=>openWater(analysis)} onToggle={toggle} user={user} onAuth={()=>setAuthOpen(true)} onSave={()=>persist(analysis)} saved={saved} saving={saving} saveError={saveError}/>:<EmptyState title="Your next insight starts with a photo." action={<button className="button primary" onClick={()=>newCheck()}>Start a crop check<ArrowRight size={16}/></button>}>Complete a crop check, or open a saved analysis from your history.</EmptyState>)}
        {page==='water'&&<WaterPlan key={activeField.name} weather={weather} field={activeField} onWeather={setWeather}/>}
        {page==='fields'&&<Fields user={user} fields={fields} loading={recordsLoading} onAuth={()=>setAuthOpen(true)} onNew={()=>setFieldModal({})} onEdit={f=>setFieldModal(f)} onDelete={setDeleteTarget} onCheck={newCheck}/>}
        {page==='history'&&<SimpleHistory user={user} analyses={analyses} guestAnalysis={analysis} loading={recordsLoading} onAuth={()=>setAuthOpen(true)} onOpen={openReport} onCheck={()=>newCheck()}/>}
        {(page==='about'||page==='guide')&&<About onCheck={()=>newCheck()} onSample={openSample}/>}
      </main>
      <footer className="page-footer"><span><Leaf size={13}/>Built for Central Valley growers</span><span>Solluce <i>·</i> SierraHacks 2026</span></footer>
    </div>
    {authOpen&&<AuthModal onClose={()=>setAuthOpen(false)}/>}
    {settingsOpen&&<Modal title="Settings" onClose={()=>setSettingsOpen(false)}><div className="settings-panel"><p>Your preferences are saved on this device.</p><fieldset><legend>Appearance</legend><div className="settings-options">{[['light','Light'],['dark','Dark']].map(([value,label])=><button key={value} className={preferences.mode===value?'selected':''} aria-pressed={preferences.mode===value} onClick={()=>updatePreference('mode',value)}>{label}</button>)}</div></fieldset><fieldset><legend>Accent color</legend><div className="settings-options colors">{[['green','Green'],['orange','Orange'],['purple','Purple']].map(([value,label])=><button key={value} className={preferences.accent===value?'selected':''} aria-pressed={preferences.accent===value} onClick={()=>updatePreference('accent',value)}><i className={'color-dot '+value}/>{label}</button>)}</div></fieldset><fieldset><legend>Language</legend><div className="settings-options">{[['en','English'],['es','Spanish']].map(([value,label])=><button key={value} className={preferences.language===value?'selected':''} aria-pressed={preferences.language===value} onClick={()=>updatePreference('language',value)}>{label}</button>)}</div><small>Existing AI reports remain in the language used when they were created.</small></fieldset></div></Modal>}
    {accountOpen&&<Modal title="Your growing space." onClose={()=>setAccountOpen(false)}><div className="account-detail"><span className="avatar large">{(user?.displayName||user?.email||'F').slice(0,1)}</span><h3>{user?.displayName||'Solluce grower'}</h3><p>{user?.email}</p></div><p className="modal-description">Your fields and analysis history are stored in your Firebase account’s private workspace.</p><button className="button secondary full" onClick={signOut}><LogOut size={17}/>Sign out</button></Modal>}
    {fieldModal&&<FieldModal initial={fieldModal.id?fieldModal:null} onClose={()=>setFieldModal(null)} onSave={async f=>{await saveField(user.uid,f);setToast('Field saved. Ready when you are.');}}/>}
    {deleteTarget&&<Modal title="Remove this field?" onClose={()=>setDeleteTarget(null)}><p className="modal-description">Remove “{deleteTarget.name}” from your fields? Its past analyses will remain in your history.</p><div className="modal-actions"><button className="button secondary" disabled={deleteBusy} onClick={()=>setDeleteTarget(null)}>Keep field</button><button className="button danger" disabled={deleteBusy} onClick={deleteField}>{deleteBusy?<Spinner label="Removing…"/>:'Remove field'}</button></div></Modal>}
    {toast&&<div className="toast" role="status"><CheckCircle2 size={18}/><span>{toast}</span><button onClick={()=>setToast('')} aria-label="Dismiss notification"><X size={16}/></button></div>}
  </div>;
}

function Overview({user,fields,analysis,weather,onWeather,onCheck,onSample,onFields,onReport,onWater,onToggle,onAuth}){
  const recommendations=analysis?.report.recommendations||[];
  const done=analysis?.completed||[];
  return <>
    <PageHeading title={user?.displayName?'Good to see you, '+user.displayName.split(' ')[0]+'.':'Good things grow from here.'} description="Check your crops, explore local weather, and plan your next step." action={<button className="button primary" onClick={()=>onCheck()}><Plus size={18}/>New crop check</button>}/>
    <div className="overview-hero-grid"><section className="farm-hero"><img src="/images/valley.webp" alt="Sunlit crop rows across a Central Valley-inspired farm landscape"/><div className="farm-hero-overlay"/><div className="farm-hero-content"><h2>A healthier harvest<br/>starts with a closer look.</h2><p>From the first sign of stress to your next best step. <br/>Meet a little more clarity for your everyday growing.</p><button className="button cream" onClick={()=>onCheck()}><ScanLine size={17}/>Let’s check your crops<ArrowUpRight size={17}/></button></div></section><WeatherPanel weather={weather} onWeather={onWeather} onPlan={onWater}/></div>
    <div className="overview-metrics"><button onClick={onFields} className="metric-card"><span className="metric-icon olive"><Sprout size={23} strokeWidth={1.5}/></span><div><span>{user?'YOUR FIELDS':analysis?.sample?'SAMPLE FIELD':'CURRENT FIELD'}</span><strong>{fields.length.toString().padStart(2,'0')}<small>{fields.length===1?'field in focus':'fields in focus'}</small></strong></div><ArrowUpRight size={18}/></button><button onClick={analysis?onReport:()=>onCheck()} className="metric-card"><span className="metric-icon peach"><ScanLine size={23} strokeWidth={1.5}/></span><div><span>YOUR NEXT STEPS</span><strong>{Math.max(0,recommendations.length-done.length).toString().padStart(2,'0')}<small>{analysis?.sample?'sample recommendations':'actions to explore'}</small></strong></div><ArrowUpRight size={18}/></button><button onClick={onWater} className="metric-card"><span className="metric-icon blue"><Droplets size={23} strokeWidth={1.5}/></span><div><span>WATER, WITH INTENTION</span><strong>07<small>{weather.sample?'days of sample weather':'days of local forecasts'}</small></strong></div><ArrowUpRight size={18}/></button></div>
    <ForecastExplorer weather={weather} compact/>
    <div className="overview-bottom-grid"><section className="panel next-steps"><SectionTitle title="A little care goes a long way." subtitle={analysis?.sample?'Explore the next steps in our sample crop check.':'Your practical next steps, in one place.'} action={analysis&&<Badge tone="neutral">{analysis.sample?'Sample plan':done.length+'/'+recommendations.length+' done'}</Badge>}/>{recommendations.length?<><div className="recommendation-list">{recommendations.slice(0,3).map((item,i)=><Recommendation key={i} item={item} index={i} compact completed={done.includes(i)} onToggle={()=>onToggle(i)}/>)}</div><div className="panel-footer"><span><Sparkles size={14}/>{analysis.sample?'A preview of what’s possible':'From your latest crop check'}</span><TextLink onClick={onReport}>View full action plan</TextLink></div></>:<EmptyState title="Your next steps start here." action={<button className="button secondary" onClick={()=>onCheck()}>Check your first crop<ArrowRight size={16}/></button>}>Add a crop photo and a little context. We’ll help you decide what to look at next.</EmptyState>}</section>
      <section className="panel field-preview-panel"><SectionTitle title="Growing, one field at a time." action={<button className="icon-button subtle" aria-label="View your fields" onClick={onFields}><ArrowUpRight size={19}/></button>}/>{fields.length?<><div className="field-preview-art"><div className="field-lines"/><span className="field-marker"><Sprout size={19}/></span><span className="field-art-label">{fields[0].sample?'ILLUSTRATIVE FIELD':'YOUR FIELD'}</span><Badge tone="cream">{cropLabel(fields[0])}</Badge></div><div className="field-preview-info"><div><h3>{fields[0].name}</h3><p><MapPin size={13}/>{locationLabel(fields[0])}<span>·</span>{fields[0].acres} acres</p></div><button className="round-arrow" aria-label={'Check crops in '+fields[0].name} onClick={()=>fields[0].sample?onSample():onCheck(fields[0])}><ArrowUpRight size={20}/></button></div><div className="field-preview-tags"><span><Droplets size={13}/>{fields[0].irrigation}</span><span><Sprout size={13}/>{fields[0].soil}</span></div></>:<EmptyState title="Every field has a story." action={<button className="button secondary" onClick={onFields}>Add your first field<Plus size={15}/></button>}>Save its details to make every crop check easier.</EmptyState>}</section></div>
    <div className="grow-banner"><span className="grow-banner-icon"><Leaf size={25} strokeWidth={1.5}/></span><div><h3>Built for the hands that feed the Valley.</h3><p>Thoughtful insights. Practical steps. A healthier tomorrow, together.</p></div><button className="text-link" onClick={onSample}>Explore a sample report<ArrowUpRight size={16}/></button></div>
  </>;
}
function FieldCard({field,onEdit,onCheck,onDelete}){
  return <article className="simple-field"><div><span>{cropLabel(field)} · {field.acres} acres</span><h3>{field.name}</h3><p><MapPin size={15}/>{locationLabel(field)}</p></div><button className="button primary" onClick={()=>onCheck(field)}><ScanLine size={17}/>Check crop</button><details><summary>More</summary><div><button onClick={()=>onEdit(field)}><Edit3 size={16}/>Edit field</button><button onClick={()=>onDelete(field)}><Trash2 size={16}/>Remove field</button></div></details></article>;
}
function Fields({user,fields,loading,onAuth,onNew,onEdit,onDelete,onCheck}){
  return <div className="simple-collection"><PageHeading title="Your fields" description="Keep your field details ready for the next crop check." action={user&&<button className="button primary" onClick={onNew}><Plus size={18}/>Add field</button>}/>{!user?<div className="simple-guest"><h2>Save your fields for next time.</h2><p>Sign in to keep your crop and location details. You can still check crops as a guest.</p><button className="button primary" onClick={onAuth}>Sign in</button><button className="simple-link" onClick={()=>onCheck()}>Continue as guest<ArrowRight size={17}/></button></div>:loading?<Spinner label="Loading your fields…"/>:fields.length?<div className="simple-fields-list">{fields.map(f=><FieldCard key={f.id} field={f} onEdit={onEdit} onDelete={onDelete} onCheck={onCheck}/>)}</div>:<EmptyState title="Add your first field" action={<button className="button primary" onClick={onNew}><Plus size={16}/>Add field</button>}>Save a crop and location to make future checks easier.</EmptyState>}</div>;
}
function HistoryPage({user,analyses,guestAnalysis,loading,onAuth,onOpen,onCheck,onSample}){
  const [query,setQuery]=useState('');
  const visible=analyses.filter(a=>(a.field.name+' '+cropLabel(a.field)+' '+a.report.headline).toLowerCase().includes(query.toLowerCase()));
  return <><PageHeading eyebrow="LOOK BACK. GROW FORWARD." title="Every check tells a story." description="Revisit your observations, action plans, and completed steps." action={<button className="button primary" onClick={onCheck}><Plus size={17}/>New crop check</button>}/>{!user?<><Notice>Guest crop checks are kept only while this page is open. <button className="inline-link" onClick={onAuth}>Sign in</button> for saved history across visits.</Notice>{guestAnalysis&&!guestAnalysis.sample?<HistoryRow analysis={guestAnalysis} onOpen={onOpen}/>:<EmptyState icon={History} title="A clearer picture, over time." action={<div className="empty-actions"><button className="button primary" onClick={onAuth}>Sign in to save history</button><button className="button secondary" onClick={onSample}>Explore a sample</button></div>}>Your saved crop checks will make it easier to revisit what you saw and what you tried.</EmptyState>}</>:<><div className="history-search"><Search size={18}/><input aria-label="Search analysis history" placeholder="Search by field, crop, or finding…" value={query} onChange={e=>setQuery(e.target.value)}/><span>{analyses.length} checks</span></div>{loading?<Spinner label="Loading your history…"/>:visible.length?<div className="history-list">{visible.map(a=><HistoryRow key={a.id} analysis={a} onOpen={onOpen}/>)}</div>:<EmptyState icon={History} title={query?'No matching crop checks.':'The first chapter starts with a photo.'} action={!query&&<button className="button primary" onClick={onCheck}>Start a crop check<ArrowRight size={16}/></button>}>{query?'Try a different field or crop name.':'Your saved analyses will appear here after your first crop check.'}</EmptyState>}</>}</>;
}
function HistoryRow({analysis,onOpen}){return <button className="history-row" onClick={()=>onOpen(analysis)}><span className="history-icon"><Leaf size={23}/></span><div><strong>{analysis.field.name}</strong><p>{analysis.report.headline}</p><small>{cropLabel(analysis.field)} · {formatDate(analysis.createdAt)} · {(analysis.completed||[]).length}/{analysis.report.recommendations.length} actions complete</small></div><Badge tone={analysis.report.overallStatus==='urgent'?'red':'neutral'}>{analysis.report.overallStatus==='urgent'?'Prompt attention':'View crop check'}</Badge><ArrowUpRight size={20}/></button>;}
function SimpleHistory({user,analyses,guestAnalysis,loading,onAuth,onOpen,onCheck}){
  const [query,setQuery]=useState('');
  const records=user?analyses:guestAnalysis&&!guestAnalysis.sample?[guestAnalysis]:[];
  const visible=records.filter(item=>(item.field.name+' '+cropLabel(item.field)+' '+item.report.headline).toLowerCase().includes(query.toLowerCase()));
  return <div className="simple-collection simple-history"><PageHeading title="Past checks" description="Look back at what you saw and what you tried."/>{!user&&<p className="simple-history-note">Guest checks last only for this session. <button onClick={onAuth}>Sign in to save them.</button></p>}{user&&records.length>5&&<label className="simple-history-search">Search past checks<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Field or crop name"/></label>}{loading?<Spinner label="Loading past checks…"/>:visible.length?<div className="simple-fields-list">{visible.map(item=><button className="simple-history-row" key={item.id} onClick={()=>onOpen(item)}><span><strong>{item.field.name}</strong><small>{cropLabel(item.field)} · {formatDate(item.createdAt)}</small><span>{item.report.headline}</span></span><ArrowRight size={19}/></button>)}</div>:<div className="simple-guest"><h2>{query?'No checks match that search.':'No crop checks yet.'}</h2><p>{query?'Try a different field or crop name.':'Take a photo and Solluce will help you decide what to inspect first.'}</p>{!query&&<button className="button primary" onClick={onCheck}>Check my crops<ArrowRight size={17}/></button>}</div>}</div>;
}
