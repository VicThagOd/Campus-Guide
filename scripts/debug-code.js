import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  const code = 'CGP-SQRJ-APW2';
  console.log(`Searching for code: ${code}`);

  // Try exact match
  const { data: exactData, error: exactError } = await supabase
    .from('unlock_codes')
    .select('*')
    .eq('code', code)
    .limit(1);

  if (exactError) {
    console.error('Query error:', exactError);
    process.exit(1);
  }

  if (exactData && exactData.length > 0) {
    console.log('Found exact match:');
    console.log(JSON.stringify(exactData[0], null, 2));
  } else {
    console.log('No exact match found.');
  }

  // Try uppercase
  const upperCode = code.toUpperCase();
  if (upperCode !== code) {
    const { data: upperData, error: upperError } = await supabase
      .from('unlock_codes')
      .select('*')
      .eq('code', upperCode)
      .limit(1);

    if (!upperError && upperData && upperData.length > 0) {
      console.log(`Found match with uppercase (${upperCode}):`);
      console.log(JSON.stringify(upperData[0], null, 2));
    }
  }

  // Check total count in table
  const { count, error: countError } = await supabase
    .from('unlock_codes')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`Total codes in table: ${count}`);
  }

  // Check PDF codes that start with CGP
  const { data: samplePdfs, error: sampleError } = await supabase
    .from('unlock_codes')
    .select('code, type, used')
    .eq('type', 'pdf')
    .limit(3);

  if (!sampleError) {
    console.log('Sample PDF codes from table:');
    samplePdfs.forEach((c) => console.log(`  ${c.code} (used: ${c.used})`));
  }
}

main();