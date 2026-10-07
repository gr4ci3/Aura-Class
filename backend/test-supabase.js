require('dotenv').config();
const { supabase, isSupabaseConfigured } = require('./supabaseClient');

async function testSupabase() {
  console.log('Testing Supabase Connection...');
  console.log('isSupabaseConfigured():', isSupabaseConfigured());
  
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured!');
    process.exit(1);
  }

  try {
    const { data: profiles, error } = await supabase.from('profiles').select('id, name, email, role, matric_number').limit(5);
    if (error) {
      console.log('Query result (Profiles table might need to be created via SQL Editor):', error.message);
    } else {
      console.log('✅ Successfully queried Supabase "profiles" table!');
      console.log('Existing profiles count:', profiles.length);
      console.log('Profiles:', profiles);
    }
  } catch (err) {
    console.error('Connection error:', err.message);
  }
}

testSupabase();
