import { ArrowLeft, ArrowRight, Check, ChevronDown, Droplets, Leaf, ScanLine, ShieldCheck } from 'lucide-react';
import { cropLabel } from '../../../shared/location';
import { formatDate } from '../ui';
import { readPreferences } from '../../lib/preferences';
import ReportInsights from './ReportInsights';

const statusText = { monitor: 'Keep observing', attention: 'Needs a closer look', urgent: 'Get help soon', insufficient_evidence: 'More information needed' };

function Action({ item, index, done, onToggle }) {
  const spanish = readPreferences().language === 'es';
  return <div className={'simple-action '+(done ? 'is-done' : '')}>
    <button className="simple-action-check" aria-label={(done ? (spanish ? 'Marcar pendiente: ' : 'Mark incomplete: ') : (spanish ? 'Marcar completado: ' : 'Mark complete: ')) + item.title} aria-pressed={done} onClick={() => onToggle(index)}>{done && <Check size={18}/>}</button>
    <div><strong>{item.title}</strong><p>{item.action}</p></div>
  </div>;
}

export default function SimpleReport({ analysis, onBack, onWater, onCheck, onToggle, user, onAuth, onSave, saved, saving, saveError }) {
  const { report, field } = analysis;
  const done = analysis.completed || [];
  const spanish = readPreferences().language === 'es';
  return <div className="simple-report">
    <button className="simple-back" onClick={onBack}><ArrowLeft size={17}/>Home</button>
    <header className="simple-report-head"><p className="simple-kicker">{analysis.sample ? 'Example crop report' : 'Your crop report'}</p><h1>{cropLabel(field)} {spanish ? 'en' : 'in'} {field.name}</h1><p>{formatDate(analysis.createdAt)} · {statusText[report.overallStatus]}</p></header>
    {analysis.sample && <p className="simple-sample-note">This is an example. No crop photo was analyzed.</p>}
    <section className="simple-report-summary"><span className="simple-kicker"><Leaf size={17}/>The main takeaway</span><h2>{report.headline}</h2><p>{report.summary}</p></section>
    <section className="simple-report-plan"><div className="simple-section-head"><h2>What to do next</h2><span>{spanish ? `${done.length} de ${report.recommendations.length} completados` : `${done.length} of ${report.recommendations.length} done`}</span></div><p className="simple-plan-help">Start with the first step. Mark each one when you finish it.</p>
      {report.recommendations.slice(0, 3).map((item, index) => <Action key={index} item={item} index={index} done={done.includes(index)} onToggle={onToggle}/>)}
      {report.recommendations.length > 3 && <details className="simple-details"><summary>Show {report.recommendations.length - 3} more steps<ChevronDown size={18}/></summary>{report.recommendations.slice(3).map((item, i) => <Action key={i + 3} item={item} index={i + 3} done={done.includes(i + 3)} onToggle={onToggle}/>)}</details>}
    </section>
    <ReportInsights report={report} weather={analysis.weather} field={field} analysisId={analysis.id}/>
    <div className="simple-report-details">
      <details><summary>What we noticed<ChevronDown size={19}/></summary><div><ul>{report.observations.map((item, i) => <li key={i}>{item}</li>)}</ul><p><strong>Photo evidence:</strong> {report.imageNotes}</p></div></details>
      <details><summary>Possible causes and how to check<ChevronDown size={19}/></summary><div>{report.issues.length ? report.issues.map((issue, i) => <article key={i}><h3>{issue.title}</h3><p>{issue.evidence}</p><p><strong>Check in the field:</strong> {issue.verification}</p><p><strong>Another possibility:</strong> {issue.alternatives}</p></article>) : <p>There is not enough evidence to name a cause. Follow the field checks above.</p>}</div></details>
      <details><summary>When to check again<ChevronDown size={19}/></summary><div>{report.timeline.map((item, i) => <article key={i}><strong>{item.when} · {item.title}</strong><p>{item.action}</p><p>{item.checkpoint}</p></article>)}</div></details>
      <details><summary>Water and weather<ChevronDown size={19}/></summary><div><p>{report.irrigationAdvice}</p>{analysis.weather && <p>Forecast: {analysis.weather.location.name}. Check the forecast again before irrigating.</p>}<button className="simple-link" onClick={onWater}><Droplets size={17}/>Open water planner<ArrowRight size={17}/></button></div></details>
      <details><summary>About this report<ChevronDown size={19}/></summary><div><p>Solluce suggests possibilities from photos and field details. Confirm a problem in the field before treating.</p><ul>{report.limitations.map((item, i) => <li key={i}>{item}</li>)}</ul><p>If symptoms spread quickly, contact a local crop adviser or <a href="https://ucanr.edu/sites/ucanr/County_Offices/" target="_blank" rel="noreferrer">UC Cooperative Extension</a>.</p></div></details>
    </div>
    {!analysis.sample && <div className="simple-report-save">{saved ? <span><Check size={18}/>Saved to your account</span> : user ? <button className="button secondary" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save report'}</button> : <p>This report stays in this session. <button onClick={onAuth}>Sign in to save it</button></p>}{saveError && <p>{saveError}</p>}</div>}
    <button className="simple-report-again" onClick={onCheck}><ScanLine size={18}/>Check another crop<ArrowRight size={18}/></button>
  </div>;
}
