import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  try {
    const { count, error } = await supabase
      .from('unlock_codes')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error querying count:', error);
      process.exit(1);
    }

    console.log('unlock_codes count:', count);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main();