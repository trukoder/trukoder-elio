import { readFile } from 'node:fs/promises';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required environment variables (SUPABASE_URL, SUPABASE_KEY).');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const CITIES = [
  // California — LA Metro
  { name: 'Los Angeles',        region: 'LA Metro',     lat: 34.0522, lon: -118.2437 },
  { name: 'Long Beach',         region: 'LA Metro',     lat: 33.7701, lon: -118.1937 },
  { name: 'Anaheim',            region: 'LA Metro',     lat: 33.8366, lon: -117.9143 },
  { name: 'Santa Ana',          region: 'LA Metro',     lat: 33.7455, lon: -117.8677 },
  { name: 'Glendale',           region: 'LA Metro',     lat: 34.1425, lon: -118.2551 },
  { name: 'Pasadena',           region: 'LA Metro',     lat: 34.1478, lon: -118.1445 },
  { name: 'Burbank',            region: 'LA Metro',     lat: 34.1808, lon: -118.3090 },
  { name: 'Torrance',           region: 'LA Metro',     lat: 33.8358, lon: -118.3406 },
  { name: 'Pomona',             region: 'LA Metro',     lat: 34.0551, lon: -117.7500 },
  { name: 'Huntington Beach',   region: 'LA Metro',     lat: 33.6595, lon: -117.9988 },

  // California — SoCal Inland
  { name: 'San Diego',          region: 'SoCal Inland', lat: 32.7157, lon: -117.1611 },
  { name: 'Chula Vista',        region: 'SoCal Inland', lat: 32.6401, lon: -117.0842 },
  { name: 'Oceanside',          region: 'SoCal Inland', lat: 33.1959, lon: -117.3795 },
  { name: 'Riverside',          region: 'SoCal Inland', lat: 33.9533, lon: -117.3962 },
  { name: 'San Bernardino',     region: 'SoCal Inland', lat: 34.1083, lon: -117.2898 },
  { name: 'Ontario',            region: 'SoCal Inland', lat: 34.0633, lon: -117.6509 },
  { name: 'Fontana',            region: 'SoCal Inland', lat: 34.0922, lon: -117.4350 },
  { name: 'Moreno Valley',      region: 'SoCal Inland', lat: 33.9425, lon: -117.2297 },
  { name: 'Corona',             region: 'SoCal Inland', lat: 33.8753, lon: -117.5664 },
  { name: 'Indio',              region: 'SoCal Inland', lat: 33.7206, lon: -116.2147 },
  { name: 'Coachella',          region: 'SoCal Inland', lat: 33.6803, lon: -116.1739 },
  { name: 'La Quinta',          region: 'SoCal Inland', lat: 33.6634, lon: -116.3100 },
  { name: 'Palm Desert',        region: 'SoCal Inland', lat: 33.7222, lon: -116.3744 },
  { name: 'Palm Springs',       region: 'SoCal Inland', lat: 33.8303, lon: -116.5453 },
  { name: 'Cathedral City',     region: 'SoCal Inland', lat: 33.7797, lon: -116.4653 },
  { name: 'Desert Hot Springs', region: 'SoCal Inland', lat: 33.9611, lon: -116.5017 },
  { name: 'Thermal',            region: 'SoCal Inland', lat: 33.6403, lon: -116.1392 },

  // California — Bay Area
  { name: 'San Francisco',      region: 'Bay Area',     lat: 37.7749, lon: -122.4194 },
  { name: 'San Jose',           region: 'Bay Area',     lat: 37.3382, lon: -121.8863 },
  { name: 'Oakland',            region: 'Bay Area',     lat: 37.8044, lon: -122.2712 },
  { name: 'Fremont',            region: 'Bay Area',     lat: 37.5485, lon: -121.9886 },
  { name: 'Sunnyvale',          region: 'Bay Area',     lat: 37.3688, lon: -122.0363 },
  { name: 'Santa Clara',        region: 'Bay Area',     lat: 37.3541, lon: -121.9552 },
  { name: 'Hayward',            region: 'Bay Area',     lat: 37.6688, lon: -122.0808 },
  { name: 'Berkeley',           region: 'Bay Area',     lat: 37.8716, lon: -122.2727 },
  { name: 'Concord',            region: 'Bay Area',     lat: 37.9780, lon: -122.0311 },
  { name: 'Vallejo',            region: 'Bay Area',     lat: 38.1041, lon: -122.2566 },
  { name: 'Santa Rosa',         region: 'Bay Area',     lat: 38.4404, lon: -122.7141 },
  { name: 'Fairfield',          region: 'Bay Area',     lat: 38.2494, lon: -122.0399 },

  // California — Central
  { name: 'Sacramento',         region: 'Central',      lat: 38.5816, lon: -121.4944 },
  { name: 'Fresno',             region: 'Central',      lat: 36.7378, lon: -119.7871 },
  { name: 'Bakersfield',        region: 'Central',      lat: 35.3733, lon: -119.0187 },
  { name: 'Stockton',           region: 'Central',      lat: 37.9577, lon: -121.2908 },
  { name: 'Modesto',            region: 'Central',      lat: 37.6391, lon: -120.9969 },
  { name: 'Visalia',            region: 'Central',      lat: 36.3302, lon: -119.2921 },
  { name: 'Salinas',            region: 'Central',      lat: 36.6777, lon: -121.6555 },
  { name: 'Roseville',          region: 'Central',      lat: 38.7521, lon: -121.2880 },
  { name: 'Elk Grove',          region: 'Central',      lat: 38.4088, lon: -121.3716 },
  { name: 'Santa Maria',        region: 'Central',      lat: 34.9530, lon: -120.4357 },
  { name: 'Oxnard',             region: 'Central',      lat: 34.1975, lon: -119.1771 },
  { name: 'Thousand Oaks',      region: 'Central',      lat: 34.1706, lon: -118.8376 },
  { name: 'Simi Valley',        region: 'Central',      lat: 34.2694, lon: -118.7815 },
  { name: 'Santa Barbara',      region: 'Central',      lat: 34.4208, lon: -119.6982 },

  // Pacific NW (WA, OR, ID)
  { name: 'Seattle',            region: 'Pacific NW',    lat: 47.6062, lon: -122.3321 },
  { name: 'Portland',           region: 'Pacific NW',    lat: 45.5152, lon: -122.6784 },
  { name: 'Spokane',            region: 'Pacific NW',    lat: 47.6588, lon: -117.4260 },
  { name: 'Tacoma',             region: 'Pacific NW',    lat: 47.2529, lon: -122.4443 },
  { name: 'Vancouver WA',       region: 'Pacific NW',    lat: 45.6280, lon: -122.6739 },
  { name: 'Bellevue',           region: 'Pacific NW',    lat: 47.6101, lon: -122.2015 },
  { name: 'Eugene',             region: 'Pacific NW',    lat: 44.0521, lon: -123.0868 },
  { name: 'Salem',              region: 'Pacific NW',    lat: 44.9429, lon: -123.0351 },
  { name: 'Boise',              region: 'Pacific NW',    lat: 43.6150, lon: -116.2023 },

  // Mountain West (AZ, NV, UT, CO, NM, MT, WY)
  { name: 'Phoenix',            region: 'Mountain West', lat: 33.4484, lon: -112.0740 },
  { name: 'Tucson',             region: 'Mountain West', lat: 32.2226, lon: -110.9747 },
  { name: 'Mesa',               region: 'Mountain West', lat: 33.4152, lon: -111.8315 },
  { name: 'Scottsdale',         region: 'Mountain West', lat: 33.4942, lon: -111.9261 },
  { name: 'Las Vegas',          region: 'Mountain West', lat: 36.1699, lon: -115.1398 },
  { name: 'Henderson',          region: 'Mountain West', lat: 36.0395, lon: -114.9817 },
  { name: 'Reno',               region: 'Mountain West', lat: 39.5296, lon: -119.8138 },
  { name: 'Salt Lake City',     region: 'Mountain West', lat: 40.7608, lon: -111.8910 },
  { name: 'Denver',             region: 'Mountain West', lat: 39.7392, lon: -104.9903 },
  { name: 'Albuquerque',        region: 'Mountain West', lat: 35.0844, lon: -106.6504 },
  { name: 'Colorado Springs',   region: 'Mountain West', lat: 38.8339, lon: -104.8214 },
  { name: 'Billings',           region: 'Mountain West', lat: 45.7833, lon: -108.5007 },
  { name: 'Helena',             region: 'Mountain West', lat: 46.5891, lon: -112.0391 },
  { name: 'Cheyenne',           region: 'Mountain West', lat: 41.1400, lon: -104.8202 },
  { name: 'Casper',             region: 'Mountain West', lat: 42.8666, lon: -106.3131 },

  // Texas
  { name: 'Houston',            region: 'Texas',         lat: 29.7604, lon: -95.3698 },
  { name: 'Dallas',             region: 'Texas',         lat: 32.7767, lon: -96.7970 },
  { name: 'Austin',             region: 'Texas',         lat: 30.2672, lon: -97.7431 },
  { name: 'San Antonio',        region: 'Texas',         lat: 29.4241, lon: -98.4936 },
  { name: 'Fort Worth',         region: 'Texas',         lat: 32.7555, lon: -97.3308 },
  { name: 'El Paso',            region: 'Texas',         lat: 31.7619, lon: -106.4850 },
  { name: 'Plano',              region: 'Texas',         lat: 33.0198, lon: -96.6989 },
  { name: 'Corpus Christi',     region: 'Texas',         lat: 27.8006, lon: -97.3964 },
  { name: 'Lubbock',            region: 'Texas',         lat: 33.5779, lon: -101.8552 },
  { name: 'Irving',             region: 'Texas',         lat: 32.8140, lon: -96.9489 },

  // Plains (ND, SD, NE, KS, OK)
  { name: 'Fargo',              region: 'Plains',        lat: 46.8772, lon: -96.7898 },
  { name: 'Bismarck',           region: 'Plains',        lat: 46.8083, lon: -100.7837 },
  { name: 'Sioux Falls',        region: 'Plains',        lat: 43.5460, lon: -96.7313 },
  { name: 'Rapid City',         region: 'Plains',        lat: 44.0805, lon: -103.2310 },
  { name: 'Omaha',              region: 'Plains',        lat: 41.2565, lon: -95.9345 },
  { name: 'Lincoln',            region: 'Plains',        lat: 40.8136, lon: -96.7026 },
  { name: 'Wichita',            region: 'Plains',        lat: 37.6872, lon: -97.3301 },
  { name: 'Topeka',             region: 'Plains',        lat: 39.0473, lon: -95.6752 },
  { name: 'Oklahoma City',      region: 'Plains',        lat: 35.4676, lon: -97.5164 },
  { name: 'Tulsa',              region: 'Plains',        lat: 36.1539, lon: -95.9928 },
];

const REGIONS = [
  'LA Metro', 'SoCal Inland', 'Bay Area', 'Central',
  'Pacific NW', 'Mountain West', 'Texas', 'Plains',
];

const INDUSTRIES = [
  { label: 'Cafe',          osm: '"amenity"="cafe"' },
  { label: 'Bakery',        osm: '"shop"="bakery"' },
  { label: 'Plumbing',      osm: '"craft"="plumber"' },
  { label: 'Electrician',   osm: '"craft"="electrician"' },
  { label: 'Pool Cleaning', osm: '"craft"="pool_construction"' },
  { label: 'Landscaping',   osm: '"craft"="gardener"' },
];

const INDUSTRY_TEMPLATES = {
  'Cafe':          'cafe.html',
  'Bakery':        'bakery.html',
  'Plumbing':      'plumbing.html',
  'Electrician':   'electric.html',
  'Pool Cleaning': 'pool.html',
  'Landscaping':   'landscape.html',
};

const RADIUS_M = 15000;
const PER_COMBO_CAP = 3;
const TOTAL_CAP = 10;
const BATCH_SIZE = 4;
const MAX_REGIONS_PER_RUN = 5;

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

function escapeHtml(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function slugify(s){
  return String(s||'').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0, 50);
}

function todayPlus(days){
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

async function buildDemoHtml(lead){
  const file = INDUSTRY_TEMPLATES[lead.industry];
  if(!file){
    throw new Error(`No template for industry "${lead.industry}"`);
  }
  const template = await readFile(`./templates/${file}`, 'utf8');
  const slug = slugify(lead.name);
  const email = `hello@${slug.replace(/-/g, '')}.com`;
  return template
    .replaceAll('{{NAME}}', escapeHtml(lead.name))
    .replaceAll('{{PHONE}}', escapeHtml(lead.phone || ''))
    .replaceAll('{{CITY}}', escapeHtml(lead.city || ''))
    .replaceAll('{{EMAIL}}', escapeHtml(email))
    .replaceAll('{{PHOTO}}', escapeHtml(lead.photo_url || ''));
}

async function netlifyCreateSite(name){
  const resp = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NETLIFY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  if(!resp.ok){
    const t = await resp.text();
    throw new Error(`Netlify site create failed (${resp.status}): ${t.slice(0,200)}`);
  }
  return await resp.json();
}

async function netlifyCreateSiteWithFallback(baseSlug){
  const tries = [baseSlug, `${baseSlug}-${Math.random().toString(36).slice(2,5)}`, `${baseSlug}-${Date.now().toString(36).slice(-4)}`];
  let lastErr;
  for(const name of tries){
    try{
      return await netlifyCreateSite(name);
    }catch(e){
      lastErr = e;
      if(!String(e.message).includes('422')) throw e;
    }
  }
  throw lastErr;
}

async function netlifyDeployHtml(siteId, html){
  const { createHash } = await import('node:crypto');
  const sha = createHash('sha1').update(html).digest('hex');

  const r1 = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NETLIFY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: { '/index.html': sha } }),
  });
  if(!r1.ok){
    const t = await r1.text();
    throw new Error(`Netlify deploy create failed (${r1.status}): ${t.slice(0,200)}`);
  }
  const deploy = await r1.json();

  const r2 = await fetch(`https://api.netlify.com/api/v1/deploys/${deploy.id}/files/index.html`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${NETLIFY_TOKEN}`,
      'Content-Type': 'application/octet-stream',
    },
    body: html,
  });
  if(!r2.ok){
    const t = await r2.text();
    throw new Error(`Netlify file upload failed (${r2.status}): ${t.slice(0,200)}`);
  }
  return deploy;
}

async function processPendingDemos(){
  if(!NETLIFY_TOKEN){
    console.log('No NETLIFY_TOKEN — skipping demo processing.');
    return;
  }
    const { count: demoCount } = await sb.from('leads').select('*', { count: 'exact', head: true }).not('demo_link', 'is', null);
  if(demoCount !== null && demoCount >= 15){
    console.log(`Demo cap reached (${demoCount} already built). Skipping new demos.`);
    await logHeartbeat(`Demo cap reached (${demoCount}/15). Pausing demo creation.`);
    return;
  }
  const { data: pending, error } = await sb.from('leads')
    .select('*')
    .eq('pending_demo', true);
  if(error){
    console.error('Failed to load pending demos:', error.message);
    return;
  }
  if(!pending || pending.length === 0){
    console.log('No pending demos to build.');
    return;
  }

  console.log(`Building ${pending.length} demo site${pending.length>1?'s':''}...`);
  let succeeded = 0;
  for(const lead of pending){
    try{
      const baseSlug = `trukoder-${slugify(lead.name)}`;
      const site = await netlifyCreateSiteWithFallback(baseSlug);
      const html = await buildDemoHtml(lead);
      await netlifyDeployHtml(site.id, html);
      const url = site.ssl_url || site.url || `https://${site.name}.netlify.app`;

      const upd = await sb.from('leads').update({
        demo_link: url,
        pending_demo: false,
      }).eq('id', lead.id);

      if(upd.error){
        console.error(`  ✗ ${lead.name}: deployed but DB update failed: ${upd.error.message}`);
      } else {
        console.log(`  ✓ ${lead.name} → ${url}`);
        succeeded++;
      }
    }catch(e){
      console.error(`  ✗ ${lead.name}: ${e.message}`);
    }
  }
  await logHeartbeat(`Built ${succeeded}/${pending.length} demos.`);
}

async function fetchOverpass(city, industry){
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node[${industry.osm}](around:${RADIUS_M},${city.lat},${city.lon});
      way[${industry.osm}](around:${RADIUS_M},${city.lat},${city.lon});
    );
    out center;
  `;
  const resp = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(overpassQuery),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'trukoder-elio/0.1 (lead-finder)',
    },
  });
  if(!resp.ok){
    throw new Error(`Overpass returned ${resp.status}`);
  }
  const data = await resp.json();
  return (data.elements || []).map(el => {
    const t = el.tags || {};
    const isChain = !!(t.brand || t['brand:wikipedia']);
    return {
      name: t.name,
      tel: t.phone || t['contact:phone'] || null,
      website: t.website || t['contact:website'] || null,
      chains: isChain ? [{ name: t.brand || 'chain' }] : [],
      rating: null,
      photos: [],
    };
  });
}

function isCandidate(p){
  if(!p.name) return false;
  if(!p.tel) return false;
  if(p.website) return false;
  if(p.chains && p.chains.length > 0) return false;
  return true;
}

function extractPhone(p){
  return p.tel || null;
}

function extractRating(p){
  return typeof p.rating === 'number' ? p.rating : null;
}

function extractPhotoUrl(p){
  if(!p.photos || p.photos.length === 0) return null;
  const photo = p.photos[0];
  if(!photo.prefix || !photo.suffix) return null;
  return `${photo.prefix}1200x600${photo.suffix}`;
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

async function scanRegion(region, existingNames){
  const regionCities = CITIES.filter(c => c.region === region);
  const combos = [];
  for(const city of regionCities){
    for(const industry of INDUSTRIES){
      combos.push({ city, industry });
    }
  }

  const found = [];
  for(let i = 0; i < combos.length; i += BATCH_SIZE){
    const batch = combos.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(async ({ city, industry }) => {
      try{
        const places = await fetchOverpass(city, industry);
        return { city, industry, places };
      }catch(e){
        console.error(`  ${city.name} × ${industry.label} failed: ${e.message}`);
        return { city, industry, places: [] };
      }
    }));

    for(const { city, industry, places } of results){
      const fresh = places
        .filter(isCandidate)
        .filter(p => !existingNames.has(p.name.toLowerCase()));
      if(fresh.length > 0){
        console.log(`  ${city.name} × ${industry.label}: ${fresh.length} new`);
      }
      for(const p of fresh.slice(0, PER_COMBO_CAP)){
        const lower = p.name.toLowerCase();
        if(existingNames.has(lower)) continue;
        existingNames.add(lower);
        found.push({ place: p, city, industry });
      }
    }

    if(i + BATCH_SIZE < combos.length){
      await new Promise(r => setTimeout(r, 300));
    }
  }
  return found;
}

async function main(){
  console.log('Elio waking up at', new Date().toISOString());
    const { count: draftCount } = await sb.from('lead_drafts').select('*', { count: 'exact', head: true });
  if(draftCount !== null && draftCount >= 100){
    console.log(`Queue has ${draftCount} drafts. Pausing lead finding.`);
    await logHeartbeat(`Queue full (${draftCount}/100). Skipping lead finding.`);
    return;
  }
  const { names: existingNames, recentNotes } = await loadExisting();

  const now = new Date();
  const slotIndex = Math.floor((now.getUTCHours() * 60 + now.getUTCMinutes()) / 30);

  let allCandidates = [];
  let regionsTried = [];

  for(let attempt = 0; attempt < MAX_REGIONS_PER_RUN; attempt++){
    const region = REGIONS[(slotIndex + attempt) % REGIONS.length];
    regionsTried.push(region);
    console.log(`Trying region: ${region}`);
    const found = await scanRegion(region, existingNames);
    if(found.length > 0){
      allCandidates = found;
      console.log(`Found ${found.length} fresh in ${region}.`);
      break;
    }
    console.log(`${region} dry, falling through...`);
  }

  if(allCandidates.length === 0){
    await logHeartbeat(`Scanned ${regionsTried.join(', ')} — no new leads anywhere.`);
    return;
  }

  const limited = allCandidates.slice(0, TOTAL_CAP);
  const usedNotes = new Set(recentNotes);
  const rows = limited.map(({ place, city, industry }) => {
    const note = pickNote(usedNotes);
    usedNotes.add(note);
    return {
      id: uid(),
      name: place.name,
      phone: extractPhone(place),
      city: city.name,
      industry: industry.label,
      status: 'New',
      follow_up_date: todayPlus(3),
      notes: note,
      date_added: todayPlus(0),
      rating: extractRating(place),
      photo_url: extractPhotoUrl(place),
    };
  });

  const { error } = await sb.from('lead_drafts').insert(rows);
  if(error){
    console.error('Draft insert failed:', error.message);
    await logHeartbeat(`ERROR inserting drafts: ${error.message}`);
    process.exit(1);
  }

  console.log(`Inserted ${rows.length} drafts.`);
  rows.forEach(r => console.log(`  - ${r.name} (${r.city}, ${r.industry})`));
  await logHeartbeat(`Found ${rows.length} new leads (tried: ${regionsTried.join(', ')}).`);
}

async function run(){
  await main();
  await processPendingDemos();
}

run().catch(err => {
  console.error('Elio crashed:', err);
  process.exit(1);
});
