import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const codesPath = path.join(process.cwd(), 'codes.json');
const codes = JSON.parse(fs.readFileSync(codesPath, 'utf8'));
const sample = codes.find((c) => c.type === 'pdf');
if (!sample) {
  console.error('No PDF code found in codes.json');
  process.exit(1);
}

async function main() {
  const { data, error } = await supabase.from('unlock_codes').select('*').eq('code', sample.code).limit(1);
  if (error) {
    console.error('Query error:', error);
    process.exit(1);
  }
  console.log('Sample code from codes.json:', sample.code);
  console.log('DB row:', JSON.stringify(data, null, 2));
}

main();