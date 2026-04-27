import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const message = `Elio is alive — ran at ${new Date().toISOString()}`;
console.log(message);

const { error } = await sb.from('elio_heartbeat').insert({ message });

if (error) {
  console.error('Heartbeat write failed:', error.message);
  process.exit(1);
}

console.log('Heartbeat written to Supabase.');
