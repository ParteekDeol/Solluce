import { ArrowRight, Droplets, Leaf, MapPin, ScanLine, Sprout } from 'lucide-react';
import WeatherPanel from './WeatherPanel';
import { cropLabel, locationLabel } from '../../shared/location';

export default function SimpleOverview({ user, fields, field, defaultLocation, analysis, weather, weatherBusy, onWeather, onCheck, onSample, onFields, onReport, onWater }) {
  const first = analysis?.report.recommendations[0];
  const homeField = field && !field.sample ? field : fields[0];
  return <div className="simple-home">
    <p className="simple-greeting">{user?.displayName ? `Welcome back, ${user.displayName.split(' ')[0]}.` : 'Welcome to Solluce.'}</p>
    <section className="simple-hero">
      <img src="/images/valley.webp" alt="Crop rows in a Central Valley-inspired landscape" />
      <div className="simple-hero-content">
        <span>For Central Valley growers</span>
        <h1>What does your crop need next?</h1>
        <p>Share a photo. Get a practical first step.</p>
        <button className="button primary" onClick={() => onCheck()}><ScanLine size={19}/>Check my crops<ArrowRight size={18}/></button>
      </div>
    </section>
    <div className="simple-home-grid">
      <section className="simple-next" aria-label="Latest crop check">
        <div className="simple-section-head"><Leaf size={20}/><h2>{analysis?.sample ? 'See an example' : analysis ? 'Your latest crop check' : 'Your next step'}</h2></div>
        {analysis?.sample ? <><h3>See a sample crop report.</h3><p>Preview the clear steps you’ll get after a crop check.</p><button className="simple-link" onClick={onReport}>View example<ArrowRight size={18}/></button></> : first ? <><p className="simple-kicker">Start here</p><h3>{first.title}</h3><p>{first.action}</p><button className="simple-link" onClick={onReport}>Open the crop report<ArrowRight size={18}/></button></> : <><h3>Start with a crop photo.</h3><p>Tell Solluce what you see and get a short plan for what to check first.</p><button className="simple-link" onClick={() => onCheck()}>Start a crop check<ArrowRight size={18}/></button></>}
      </section>
      <section className="simple-weather" aria-label="Local weather"><WeatherPanel weather={weather} field={field} defaultLocation={defaultLocation} busy={weatherBusy} onWeather={onWeather} onPlan={onWater}/></section>
    </div>
    <div className="simple-home-foot">
      {homeField && !homeField.sample && <button onClick={onFields}><Sprout size={19}/><span><strong>{homeField.name}</strong><small>{cropLabel(homeField)} · {locationLabel(homeField)}</small></span><ArrowRight size={18}/></button>}
      <button onClick={onWater}><Droplets size={19}/><span><strong>Plan water</strong><small>Use the forecast for your field</small></span><ArrowRight size={18}/></button>
    </div>
  </div>;
}
