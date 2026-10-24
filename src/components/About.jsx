import { ArrowRight, ShieldCheck } from 'lucide-react';
import { readPreferences } from '../lib/preferences';

const team = ['Parteek Deol', 'Jacob Fells', 'Xian Dimaandal', 'Dhanesh Gopichandran'];

export default function About({ onCheck, onSample }) {
  const spanish = readPreferences().language === 'es';
  return <div className="simple-about">
    <p className="simple-kicker">About Solluce</p>
    <h1>Helpful answers for the people who grow our food.</h1>
    <p className="simple-about-lead">Solluce helps Central Valley growers make sense of crop problems and plan their next step with local weather in mind.</p>
    <img src="/images/valley.webp" alt="Crop rows in a Central Valley-inspired landscape"/>
    <section><h2>Why we built it</h2><p>When leaves change color or plants wilt, it can be hard to know what to check first. Water is precious here, and guessing can waste time and resources. We built Solluce to turn a crop photo and a few field details into a practical plan.</p></section>
    <section><h2>How it works</h2><ol><li><strong>Show us your crop.</strong> Add a photo and describe what you notice.</li><li><strong>Review the next step.</strong> Solluce suggests what to inspect and why.</li><li><strong>Follow up in the field.</strong> Check the evidence and use local weather to plan water.</li></ol><button className="button primary" onClick={onCheck}>Check my crops<ArrowRight size={17}/></button></section>
    <section><h2>Our team</h2><p>{spanish ? 'Solluce fue creado para SierraHacks 2026 por ' : 'Solluce was built for SierraHacks 2026 by '}{team.join(', ')}.</p></section>
    <section className="simple-about-safety"><ShieldCheck size={23}/><div><h2>Built to support your judgment</h2><p>A photo cannot confirm a diagnosis, and a forecast cannot measure soil moisture. Verify suspected problems before treating, and check actual field conditions before irrigating.</p><a href="https://ucanr.edu/sites/ucanr/County_Offices/" target="_blank" rel="noreferrer">Find your local UC Extension office ↗</a></div></section>
    <button className="simple-link" onClick={onSample}>See an example report<ArrowRight size={17}/></button>
  </div>;
}
