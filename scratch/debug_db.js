require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugSession() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using service role to check data first

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('--- Checking evaluations table ---');
  const { data: evaluations, error: evalError } = await supabase
    .from('evaluations')
    .select('id, status, candidate_id, evaluator_id')
    .limit(5);

  if (evalError) {
    console.error('Error fetching evaluations:', evalError);
  } else {
    console.log('Evaluations found:', evaluations);
  }

  console.log('--- Checking profiles table ---');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name');
  
  if (profileError) {
    console.error('Error fetching profiles:', profileError);
  } else {
    console.log('Profiles found:', profiles);
  }

  // Check the RLS specifically for a mocked evaluator
  // (We can't easily mock auth.uid() in a node script without a JWT)
}

debugSession();
