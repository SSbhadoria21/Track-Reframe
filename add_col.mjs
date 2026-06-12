import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url text;' });
  if (error) {
      console.log("RPC exec_sql not found or failed, let's use REST directly or something else?", error);
      // Let's just create a raw query if we can't use rpc.
      // Wait, we can't easily run DDL through Supabase js without RPC.
  }
  console.log(data || error)
}
test()
