import { useState } from 'react';
import { Check, ChevronDown, Droplets, Leaf, Search, Sprout } from 'lucide-react';

const categoryIcon={water:Droplets,soil:Sprout,crop:Leaf,inspection:Search};
const priorityName={today:'Do today',this_week:'This week',monitor:'Keep an eye on it'};

export default function Recommendation({item,index,completed,onToggle,compact=false}) {
  const [expanded,setExpanded]=useState(false);
  const Icon=categoryIcon[item.category]||Leaf;
  return <div className={'recommendation '+(completed?'done ':'')+(expanded?'expanded':'')}>
    <button className="task-check" aria-label={(completed?'Mark incomplete: ':'Mark complete: ')+item.title} aria-pressed={completed} onClick={onToggle}>{completed?<Check size={15}/>:<span/>}</button>
    <div className="recommendation-content"><button className="recommendation-title" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}><span>{item.title}</span><ChevronDown size={16}/></button><div className="recommendation-meta"><Icon size={12}/><span>{item.category==='inspection'?'Field check':item.category.charAt(0).toUpperCase()+item.category.slice(1)}</span><i>·</i><span className={item.priority==='today'?'priority-today':''}>{priorityName[item.priority]}</span></div>{expanded&&<div className="recommendation-detail"><p>{item.action}</p><div><strong>Why it helps</strong><p>{item.why}</p></div></div>}</div>
    {!compact&&<span className="recommendation-number">{String(index+1).padStart(2,'0')}</span>}
  </div>;
}
