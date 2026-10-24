import { useState } from 'react';
import { Check, ChevronDown, ClipboardCheck, Droplets, Leaf, Search, Sprout } from 'lucide-react';

const categoryIcon={water:Droplets,soil:Sprout,crop:Leaf,inspection:Search};
const categoryName={water:'Water',soil:'Soil',crop:'Crop care',inspection:'Field check'};
const priorityName={today:'Do today',this_week:'This week',monitor:'Keep watching'};

function ActionCard({item,index,completed,onToggle}) {
  const [open,setOpen]=useState(index===0);
  const Icon=categoryIcon[item.category]||Leaf;
  return <article className={'analysis-action '+item.category+(completed?' completed':'')}>
    <button className="analysis-action-check" aria-label={(completed?'Mark incomplete: ':'Mark complete: ')+item.title} aria-pressed={completed} onClick={onToggle}>{completed?<Check size={19}/>:<span/>}</button>
    <div className="analysis-action-body"><div className="analysis-action-top"><span className="analysis-category"><Icon size={15}/>{categoryName[item.category]}</span><span className={'analysis-priority '+item.priority}>{priorityName[item.priority]}</span></div><button className="analysis-action-title" aria-expanded={open} onClick={()=>setOpen(!open)}><span>{item.title}</span><ChevronDown size={19}/></button>{open&&<div className="analysis-action-detail"><p>{item.action}</p><div><strong>Why this step matters</strong><p>{item.why}</p></div></div>}</div>
  </article>;
}

export default function ActionPlan({report,completed,onToggle}) {
  const [filter,setFilter]=useState('all');
  const actions=report.recommendations;
  const checked=new Set(completed.filter(index=>Number.isInteger(index)&&index>=0&&index<actions.length));
  const done=checked.size;
  const percent=Math.round(done/actions.length*100);
  const filters=[['all','All actions'],['today','Do today'],['this_week','This week'],['monitor','Keep watching']];
  const visible=actions.map((item,index)=>({...item,index})).filter(item=>filter==='all'||item.priority===filter);
  const categories=Object.keys(categoryName).map(category=>({category,count:actions.filter(item=>item.category===category).length})).filter(item=>item.count);
  return <div className="analysis-plan"><div className="analysis-plan-main"><div className="analysis-section-intro"><p className="eyebrow">YOUR ACTION PLAN</p><h2>Turn insight into progress.</h2><p>Open each step for details, then check it off after you complete it.</p></div><div className="analysis-filters" role="group" aria-label="Filter recommendations by timing">{filters.map(([value,label])=><button key={value} className={filter===value?'selected':''} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}<span>{value==='all'?actions.length:actions.filter(item=>item.priority===value).length}</span></button>)}</div><div className="analysis-action-list">{visible.length?visible.map(item=><ActionCard key={item.index} item={item} index={item.index} completed={checked.has(item.index)} onToggle={()=>onToggle(item.index)}/>):<div className="analysis-empty-filter">No actions in this timing group. Choose another filter to see your plan.</div>}</div></div><aside className="analysis-plan-side"><section className="analysis-card analysis-progress"><p className="eyebrow">YOUR PROGRESS</p><div className="analysis-progress-ring" style={{'--progress':percent+'%'}}><div><strong>{done}<small>/{actions.length}</small></strong><span>complete</span></div></div><h3>{done===actions.length?'All steps checked off.':done?'Keep following through.':'Start with one step.'}</h3><p>Checking off a step records your progress, not a change in crop health.</p></section><section className="analysis-card analysis-action-mix"><p className="eyebrow">ACTION MIX</p><h3>Where the work is focused</h3>{categories.map(item=><div key={item.category} className={'analysis-mix-row '+item.category}><div><span>{categoryName[item.category]}</span><strong>{item.count}</strong></div><span className="analysis-mix-track"><i style={{width:item.count/actions.length*100+'%'}}/></span></div>)}</section></aside></div>;
}
