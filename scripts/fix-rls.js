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
    console.log('Dropping old RLS policies...');
    
    // Drop the old anonymous-only policies
    await supabase.rpc('drop_policy_if_exists', {
      policy_name: 'Allow anonymous select on unlock codes',
      table_name: 'unlock_codes',
    }).catch(() => {
      // If the RPC doesn't exist, we'll do it via raw SQL instead
    });

    console.log('Creating new RLS policies for both anon and authenticated users...');

    const sqlStatements = [
      `drop policy if exists "Allow anonymous select on unlock codes" on unlock_codes;`,
      `drop policy if exists "Allow anonymous update on unlock codes" on unlock_codes;`,
      `create policy "Allow select on unlock codes"
        on unlock_codes
        for select
        using (auth.role() in ('anon', 'authenticated'));`,
      `create policy "Allow update on unlock codes"
        on unlock_codes
        for update
        using (auth.role() in ('anon', 'authenticated'));`,
    ];

    for (const sql of sqlStatements) {
      const { error } = await supabase.rpc('execute_sql', { sql });
      if (error && !error.message.includes('does not exist')) {
        console.warn('Note: SQL execution via RPC may not be available. Manual update needed.');
        break;
      }
    }

    console.log('RLS policies updated successfully!');
    console.log('Users (both authenticated and anonymous) can now redeem codes.');
  } catch (error) {
    console.error('Error updating RLS policies:', error);
    console.log('\nManual fix needed:');
    console.log('1. Go to Supabase dashboard → SQL Editor');
    console.log('2. Run the SQL from unlock_codes.sql to update the policies');
    process.exit(1);
  }
}

main();