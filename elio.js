import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const CITIES = [
  { name: 'Indio',              lat: 33.7206, lon: -116.2147 },
  { name: 'Coachella',          lat: 33.6803, lon: -116.1739 },
  { name: 'La Quinta',          lat: 33.6634, lon: -116.3100 },
  { name: 'Palm Desert',        lat: 33.7222, lon: -116.3744 },
  { name: 'Palm Springs',       lat: 33.8303, lon: -116.5453 },
  { name: 'Cathedral City',     lat: 33.7797, lon: -116.4653 },
  { name: 'Desert Hot Springs', lat: 33.9611, lon: -116.5017 },
  { name: 'Thermal',            lat: 33.6403, lon: -116.1392 },
];

const INDUSTRIES = [
  { label: 'Cafe',        osm: '"amenity"="cafe"' },
  { label: 'Bakery',      osm: '"shop"="bakery"' },
  { label: 'Plumbing',    osm: '"craft"="plumber"' },
  { label: 'Electrician', osm: '"craft"="electrician"' },
];

const RADIUS_M = 5000;
const MAX_PER_RUN = 3;

const NOTES = [
  'You got dis!',
  'One call closer.',
  'Their site is begging for you.',
  'Tiny step, big momentum.',
  'They need what only you can build.',
  'Your future client just doesn\'t know yet.',
  'Be the email they remember.',
  'Confidence — but make it kind.',
  'Today\'s no is tomorrow\'s yes.',
  "You're the upgrade they didn't know they needed.",
  'Make their phone ring.',
  'Sunshine and signed contracts.',
  'Speak softly, design boldly.',
  'Show up, stand out.',
  'A little courage goes a long way.',
  'Quietly unstoppable.',
  'Their first impression is in your hands.',
  'Polish, pixels, profit.',
  'Dial like you mean it.',
  'Worst they can say is no.',
];

function todayPlus(days){
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

async function fetchOverpass(city, industry){
  const query = `
    [out:json][timeout:25];
    (
      node[${industry.osm}](around:${RADIUS_M},${city.lat},${city.lon});
      way[${industry.osm}](around:${RADIUS_M},${city.lat},${city.lon});
    );
    out center;
  `;
  const resp = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'text/plain' },
  });
  if(!resp.ok){
    throw new Error(`Overpass returned ${resp.status}`);
  }
  const data = await resp.json();
  return data.elements || [];
}

function isCandidate(el){
  const t = el.tags || {};
  if(!t.name) return false;
  if(t.website || t['contact:website']) return false;
  return true;
}

function extractPhone(el){
  const t = el.tags || {};
  return t.phone || t['contact:phone'] || null;
}

async function loadExisting(){
  const [leadsRes, draftsRes] = await Promise.all([
    sb.from('leads').select('name'),
    sb.from('lead_drafts').select('name, notes'),
  ]);
  const names = new Set();
  (leadsRes.data || []).forEach(l => names.add((l.name||'').toLowerCase()));
  (draftsRes.data || []).forEach(l => names.add((l.name||'').toLowerCase()));
  const recentNotes = new Set();
  (draftsRes.data || []).forEach(l => { if(l.notes) recentNotes.add(l.notes); });
  return { names, recentNotes };
}

function pickNote(used){
  const available = NOTES.filter(n => !used.has(n));
  return pick(available.length > 0 ? available : NOTES);
}

async function logHeartbeat(message){
  await sb.from('elio_heartbeat').insert({ message });
}

async function main(){
  const startedAt = new Date().toISOString();
  console.log('Elio waking up at', startedAt);

  const { names: existingNames, recentNotes } = await loadExisting();

  const city = pick(CITIES);
  const industry = pick(INDUSTRIES);
  console.log(`Hunting ${industry.label} in ${city.name}...`);

  const elements = await fetchOverpass(city, industry);
  console.log(`Overpass returned ${elements.length} elements.`);

  const candidates = elements
    .filter(isCandidate)
    .filter(el => !existingNames.has(el.tags.name.toLowerCase()));

  console.log(`${candidates.length} candidates after dedupe + website filter.`);

  if(candidates.length === 0){
    await logHeartbeat(`No new ${industry.label}s in ${city.name}.`);
    console.log('Nothing to insert. Done.');
    return;
  }

  const usedNotes = new Set(recentNotes);
  const rows = candidates.slice(0, MAX_PER_RUN).map(el => {
    const note = pickNote(usedNotes);
    usedNotes.add(note);
    return {
      id: uid(),
      name: el.tags.name,
      phone: extractPhone(el),
      city: city.name,
      industry: industry.label,
      status: 'New',
      follow_up_date: todayPlus(3),
      notes: note,
      date_added: todayPlus(0),
    };
  });

  const { error } = await sb.from('lead_drafts').insert(rows);
  if(error){
    console.error('Draft insert failed:', error.message);
    await logHeartbeat(`ERROR inserting drafts: ${error.message}`);
    process.exit(1);
  }

  console.log(`Inserted ${rows.length} drafts:`);
  rows.forEach(r => console.log(`  - ${r.name} (${r.city}, ${r.industry})`));
  await logHeartbeat(`Found ${rows.length} new ${industry.label}s in ${city.name}.`);
}

main().catch(err => {
  console.error('Elio crashed:', err);
  process.exit(1);
});
