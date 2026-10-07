require('dotenv').config();
const { supabase } = require('./supabaseClient');

async function checkAllTables() {
  console.log('Checking all Supabase tables...');

  // 1. Check profiles
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, email, name, role').limit(2);
  console.log('1. profiles:', pErr ? `❌ ${pErr.message}` : `✅ OK (${profiles.length} records)`);

  // 2. Check assignments
  const { data: assignments, error: aErr } = await supabase.from('assignments').select('id, title, attachment_url').limit(2);
  console.log('2. assignments:', aErr ? `❌ ${aErr.message}` : `✅ OK (${assignments.length} records)`);

  // 3. Check student_assignments
  const { data: studentAsgs, error: sErr } = await supabase.from('student_assignments').select('id, status, is_graded, attachment_url').limit(2);
  console.log('3. student_assignments:', sErr ? `❌ ${sErr.message}` : `✅ OK (${studentAsgs.length} records)`);

  // 4. Check password_reset_tokens
  const { data: tokens, error: tErr } = await supabase.from('password_reset_tokens').select('id, token, used').limit(2);
  console.log('4. password_reset_tokens:', tErr ? `❌ ${tErr.message}` : `✅ OK (${tokens.length} records)`);
}

checkAllTables();
