import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (you need to set SUPABASE_SERVICE_ROLE_KEY)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Path to codes.json (assuming it's in the root)
const codesPath = path.join(__dirname, '..', 'codes.json');

async function importCodes() {
  try {
    // Read and parse codes.json
    const codesData = fs.readFileSync(codesPath, 'utf8');
    const codes = JSON.parse(codesData);

    console.log(`Importing ${codes.length} codes...`);

    // Insert codes in batches to avoid payload size limits
    const batchSize = 1000;
    for (let i = 0; i < codes.length; i += batchSize) {
      const batch = codes.slice(i, i + batchSize);

      // Map JSON fields to DB column names (snake_case)
      const dbBatch = batch.map((c) => ({
        code: c.code,
        type: c.type,
        used: c.used ?? false,
        used_by_email: c.usedByEmail ?? null,
        used_at: c.usedAt ?? null,
        expires_at: c.expiresAt ?? null,
      }));

      const { data, error } = await supabase.from('unlock_codes').insert(dbBatch);

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        return;
      }

      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} codes)`);
    }

    console.log('All codes imported successfully!');
  } catch (error) {
    console.error('Error importing codes:', error);
  }
}

importCodes();