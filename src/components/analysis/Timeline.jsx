import { useState } from 'react';
import { CalendarDays, ClipboardCheck, Search, ShieldCheck } from 'lucide-react';

export default function Timeline({report}) {
  const [selected,setSelected]=useState(0);
  const active=report.timeline[selected];
  return <div className="analysis-timeline-view"><div className="analysis-section-intro"><p className="eyebrow">OBSERVE · ACT · CHECK AGAIN</p><h2>A timeline you can follow.</h2><p>These are checkpoints for gathering evidence, not promises of recovery.</p></div><div className="analysis-milestones" role="group" aria-label="Select a follow-up checkpoint">{report.timeline.map((item,i)=><button key={i} className={i===selected?'selected':''} aria-pressed={i===selected} onClick={()=>setSelected(i)}><span className="analysis-milestone-number">{String(i+1).padStart(2,'0')}</span><span><strong>{item.when}</strong><small>{item.title}</small></span></button>)}</div><section className="analysis-card analysis-milestone-detail"><div className="analysis-milestone-date"><CalendarDays size={23}/><span>{active.when}</span></div><h3>{active.title}</h3><div className="analysis-milestone-grid"><div><span><ClipboardCheck size={18}/>WHAT TO DO</span><p>{active.action}</p></div><div><span><Search size={18}/>WHAT TO CHECK</span><p>{active.checkpoint}</p></div></div></section><div className="analysis-timeline-next"><ShieldCheck size={18}/><span>If symptoms spread quickly or the field declines, ask a local agronomist or UC Cooperative Extension for help.</span></div></div>;
}
