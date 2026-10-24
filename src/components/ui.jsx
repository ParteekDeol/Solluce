import { useEffect, useRef } from 'react';
import { Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake, X, LoaderCircle, ArrowUpRight, Info, Sprout } from 'lucide-react';

export function Brand({ compact = false }) {
  return <span className={'brand ' + (compact ? 'compact' : '')}><svg viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 24h26M11 19a9 9 0 0 1 18 0M20 3v4M6 10l3 3M34 10l-3 3M20 29v8M12 29l-4 5M28 29l4 5"/></g></svg><span>solluce<span className="brand-dot">.</span></span></span>;
}
export function WeatherIcon({ code = 0, ...props }) {
  const Icon = code <= 1 ? Sun : code === 2 ? CloudSun : code <= 48 ? Cloud : code >= 95 ? CloudLightning : (code >= 71 && code <= 77) || code === 85 || code === 86 ? Snowflake : CloudRain;
  return <Icon {...props} />;
}
export function weatherLabel(code) { return code <= 1 ? 'Mostly sunny' : code === 2 ? 'Partly cloudy' : code <= 48 ? 'Cloudy' : code >= 95 ? 'Thunderstorms' : (code >= 71 && code <= 77) ? 'Snow' : 'Rain'; }
export function Badge({ children, tone = 'green', dot = false }) { return <span className={'badge ' + tone}>{dot && <span className="status-dot" />}{children}</span>; }
export function Spinner({ label = 'Loading…' }) { return <span className="loading-inline" role="status"><LoaderCircle className="spin" size={18} />{label}</span>; }
export function Notice({ children, tone = 'neutral' }) { return <div className={'notice ' + tone} role={tone === 'error' ? 'alert' : 'status'}><Info size={17} /><div>{children}</div></div>; }
export function EmptyState({ icon: Icon = Sprout, title, children, action }) { return <div className="empty-state"><span className="empty-icon"><Icon size={28} /></span><h3>{title}</h3><p>{children}</p>{action}</div>; }
export function PageHeading({ eyebrow, title, description, action }) { return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</div>; }
export function SectionTitle({ title, subtitle, action }) { return <div className="section-title"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>; }
export function TextLink({ children, onClick }) { return <button className="text-link" onClick={onClick}>{children}<ArrowUpRight size={16}/></button>; }
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={ref} className={'modal ' + (wide ? 'wide' : '')} aria-labelledby="modal-title" onCancel={e=>{e.preventDefault();onClose();}} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal-inner"><button className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}><X size={20}/></button><h2 id="modal-title">{title}</h2>{children}</div>
  </dialog>;
}
export function formatDate(value, options = { month: 'short', day: 'numeric' }) { return new Date(value.length === 10 ? value + 'T12:00:00' : value).toLocaleDateString('en-US', options); }
export function formatNumber(number) { return Number.isFinite(number) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(number) : '—'; }
