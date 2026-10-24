import { useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BookmarkPlus, CalendarDays, Camera,
  Check, ChevronDown, CircleAlert, ClipboardCheck, Droplets, Eye, Leaf,
  MapPin, ScanLine, Search, ShieldCheck, Sprout,
} from 'lucide-react';
import { Badge, Notice, PageHeading, formatDate } from '../ui';
import { locationLabel } from '../../../shared/location';
import ActionPlan from './ActionPlan';
import Findings from './Findings';
import Timeline from './Timeline';
import WeatherInsight from './WeatherInsight';
import './analysis.css';
import './analysis-photo.css';

const statusName={monitor:'Keep observing',attention:'Needs a closer look',urgent:'Prompt attention',insufficient_evidence:'More evidence needed'};

function Overview({analysis,onTab,onWater}) {
  const {report,field}=analysis;
  const first=report.recommendations[0];
  return <div className="analysis-overview">
    <div className="analysis-overview-main">
      <section className="analysis-card analysis-observations"><div className="analysis-card-heading"><span className="analysis-card-icon olive"><Eye size={21}/></span><div><p className="eyebrow">START WITH THE EVIDENCE</p><h2>What the report observed</h2></div></div><ul>{report.observations.map((observation,i)=><li key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{observation}</p></li>)}</ul><div className="analysis-evidence-note"><Camera size={19}/><div><strong>Photo evidence: {report.imageQuality}</strong><p>{report.imageNotes}</p></div></div></section>
      <section className="analysis-card analysis-focus"><div><span className="analysis-card-icon coral"><ClipboardCheck size={23}/></span><p className="eyebrow">YOUR FIRST USEFUL MOVE</p><h2>{first.title}</h2><p>{first.action}</p><button className="analysis-inline-link" onClick={()=>onTab('plan')}>Explore all recommendations<ArrowRight size={17}/></button></div><span className="analysis-focus-number">01</span></section>
      <section className="analysis-card analysis-field"><div className="analysis-card-heading"><span className="analysis-card-icon sky"><Sprout size={21}/></span><div><p className="eyebrow">FIELD CONTEXT</p><h2>Details behind this check</h2></div></div><div className="analysis-field-grid">{[['Crop',field.crop],['Growth stage',field.stage],['Soil',field.soil],['Irrigation',field.irrigation],['Field size',field.acres+' acres'],['Location',locationLabel(field)]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>
    </div>
    <aside className="analysis-overview-side">
      <section className="analysis-card analysis-possibilities"><div className="analysis-card-heading"><span className="analysis-card-icon amber"><CircleAlert size={21}/></span><div><p className="eyebrow">POSSIBLE CAUSES</p><h2>What to investigate</h2></div></div>{report.issues.length?<div className="analysis-issue-preview">{report.issues.map((issue,i)=><button key={i} onClick={()=>onTab('findings')}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{issue.title}</strong><small>{issue.confidence} evidence confidence · {issue.severity} concern</small></div><ArrowUpRight size={17}/></button>)}</div>:<p className="analysis-no-issues">There is not enough evidence to name a specific issue. Follow the inspection steps and add clearer photos if possible.</p>}<button className="analysis-inline-link" onClick={()=>onTab('findings')}>Review evidence and alternatives<ArrowRight size={17}/></button></section>
      <WeatherInsight weather={analysis.weather}/>
      <section className="analysis-card analysis-irrigation"><span className="analysis-card-icon sky"><Droplets size={22}/></span><div><p className="eyebrow">WATER NOTE</p><h2>Check before changing irrigation</h2><p>{report.irrigationAdvice}</p><button className="analysis-inline-link" onClick={onWater}>Open water planner<ArrowRight size={17}/></button></div></section>
    </aside>
  </div>;
}

export default function ReportV2({analysis,onBack,onWater,onCheck,onToggle,user,onAuth,onSave,saved,saving,saveError}) {
  const [tab,setTab]=useState('overview');
  const [photoIndex,setPhotoIndex]=useState(0);
  const tabsRef=useRef(null);
  const {report,field}=analysis;
  const completed=analysis.completed||[];
  const tabs=[['overview','Overview',Eye],['plan','Action plan',ClipboardCheck],['findings','Findings',Leaf],['timeline','Timeline',CalendarDays]];
  const tabIds=tabs.map(item=>item[0]);
  const today=report.recommendations.filter(item=>item.priority==='today').length;
  const metrics=[
    {label:'Report observations',value:report.observations.length,icon:Eye,tone:'olive',detail:'What was described or visible',target:'overview'},
    {label:'Possible issues',value:report.issues.length,icon:Search,tone:'coral',detail:'Require field verification',target:'findings'},
    {label:'Actions for today',value:today,icon:ClipboardCheck,tone:'sky',detail:'Out of '+report.recommendations.length+' total steps',target:'plan'},
    {label:'Follow-up checkpoints',value:report.timeline.length,icon:CalendarDays,tone:'amber',detail:'A plan to reassess',target:'timeline'},
  ];
  function openTab(id) {
    setTab(id);
    requestAnimationFrame(()=>{
      document.getElementById('analysis-tab-'+id)?.focus({preventScroll:true});
      tabsRef.current?.scrollIntoView({block:'start',behavior:'smooth'});
    });
  }
  return <div className="analysis-page">
    <button className="back-link" onClick={onBack}><ArrowLeft size={17}/>Back to overview</button>
    <PageHeading eyebrow={analysis.sample?'ILLUSTRATIVE CROP REPORT':'YOUR CROP ANALYSIS'} title="Your field, in focus." description={field.name+' · '+field.crop+' · '+formatDate(analysis.createdAt)} action={<button className="button secondary" onClick={onCheck}><ScanLine size={17}/>New crop check</button>}/>
    {analysis.sample&&<Notice>This is an illustrative tomato-farm report. The findings and weather are sample data; no crop photo was analyzed.</Notice>}
    {analysis.weatherWarning&&<Notice tone="warning">{analysis.weatherWarning}</Notice>}
    <section className={'analysis-lead '+report.overallStatus}><div className="analysis-lead-content"><div className="analysis-lead-meta"><Badge tone={report.overallStatus==='urgent'?'red':report.overallStatus==='monitor'?'green':'amber'} dot>{statusName[report.overallStatus]}</Badge><span><MapPin size={15}/>{locationLabel(field)}</span></div><p className="eyebrow">THE MAIN TAKEAWAY</p><h2>{report.headline}</h2><p>{report.summary}</p><div className="analysis-lead-footer"><ShieldCheck size={18}/>{analysis.sample?'Example report':'AI-assisted observations'} · Verify before treating</div></div><div className={'analysis-lead-visual '+(analysis.photoPreviews?.length?'has-photo':'')}>{analysis.photoPreviews?.length?<><img src={analysis.photoPreviews[photoIndex]} alt={'Uploaded crop photo '+(photoIndex+1)+' of '+analysis.photoPreviews.length}/>{analysis.photoPreviews.length>1&&<div className="analysis-photo-thumbs" role="group" aria-label="Choose a crop photo">{analysis.photoPreviews.map((preview,i)=><button key={i} className={photoIndex===i?'selected':''} aria-label={'View crop photo '+(i+1)} aria-pressed={photoIndex===i} onClick={()=>setPhotoIndex(i)}><img src={preview} alt=""/></button>)}</div>}</>:<div className="analysis-lead-pattern"><Leaf size={82} strokeWidth={.8}/><span>{analysis.sample?'ILLUSTRATIVE EXAMPLE':'PHOTO NOT STORED'}</span></div>}</div></section>
    {!analysis.sample&&<div className="analysis-save">{saved?<span><Check size={17}/>Saved to your account</span>:user?<button onClick={onSave} disabled={saving}><BookmarkPlus size={17}/>{saving?'Saving report…':'Save this report'}</button>:<span>This report stays in your guest session. <button onClick={onAuth}>Sign in to save it</button></span>}{saveError&&<Notice tone="error">{saveError}</Notice>}</div>}
    <div className="analysis-metrics">{metrics.map(item=><button type="button" className={'analysis-metric '+item.tone} key={item.label} onClick={()=>openTab(item.target)} aria-label={`${item.value} ${item.label}. Open ${item.target}.`}><span className="analysis-metric-icon"><item.icon size={23}/></span><strong>{String(item.value).padStart(2,'0')}</strong><div><h3>{item.label}</h3><p>{item.detail}</p></div></button>)}</div>
    <div className="analysis-tabs" ref={tabsRef} role="tablist" aria-label="Analysis sections">{tabs.map(([id,label,Icon])=><button key={id} role="tab" id={'analysis-tab-'+id} aria-controls={'analysis-panel-'+id} aria-selected={tab===id} tabIndex={tab===id?0:-1} className={tab===id?'active':''} onClick={()=>setTab(id)} onKeyDown={event=>{if(event.key!=='ArrowRight'&&event.key!=='ArrowLeft')return;event.preventDefault();const next=tabIds[(tabIds.indexOf(tab)+(event.key==='ArrowRight'?1:tabIds.length-1))%tabIds.length];setTab(next);document.getElementById('analysis-tab-'+next)?.focus();}}><Icon size={18}/>{label}</button>)}</div>
    <div role="tabpanel" id={'analysis-panel-'+tab} aria-labelledby={'analysis-tab-'+tab} className="analysis-panel">{tab==='overview'?<Overview analysis={analysis} onTab={openTab} onWater={onWater}/>:tab==='plan'?<ActionPlan report={report} completed={completed} onToggle={onToggle}/>:tab==='findings'?<Findings report={report}/>:<Timeline report={report}/>}</div>
    <details className="analysis-limitations"><summary><ShieldCheck size={19}/>How to use this report safely<ChevronDown size={19}/></summary><div><p>Solluce supports observation and planning. Confirm suspected problems before treating. Contact a local crop adviser or <a href="https://ucanr.edu/sites/ucanr/County_Offices/" target="_blank" rel="noreferrer">UC Cooperative Extension</a> for severe or spreading symptoms.</p><ul>{report.limitations.map((limitation,i)=><li key={i}>{limitation}</li>)}</ul><p>Analysis: {analysis.model} · {formatDate(analysis.createdAt)}{analysis.weather&&' · Weather: '+analysis.weather.source}</p></div></details>
  </div>;
}
