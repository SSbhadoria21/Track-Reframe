import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gadoojmbbftdipunsprd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZG9vam1iYmZ0ZGlwdW5zcHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY1ODE2OCwiZXhwIjoyMDkyMjM0MTY4fQ.TXFFE70zTwrr65VmhqgFWwbe_vykDj0oAat-gZ3yIL4'
);

async function test() {
  const shareSearch = "sumit";
  console.log("Searching for:", shareSearch);
  const { data, error } = await supabase.from('users')
    .select('id, username, full_name, avatar_url')
    .or(`username.ilike.%${shareSearch}%,full_name.ilike.%${shareSearch}%`)
    .limit(5);

  console.log("Data:", data);
  console.log("Error:", error);
}

test();
