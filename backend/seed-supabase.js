require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabase } = require('./supabaseClient');

async function seedSupabase() {
  console.log('Seeding Supabase with initial demo accounts...');
  const passwordHash = await bcrypt.hash('studentpass123', 10);

  // 1. Lecturer: Dr. Jane Vance
  const { data: lecturer, error: lErr } = await supabase
    .from('profiles')
    .upsert({
      email: 'jane.vance@school.edu',
      password: passwordHash,
      name: 'Dr. Jane Vance',
      role: 'lecturer',
      department: 'Computer Engineering'
    }, { onConflict: 'email' })
    .select();

  if (lErr) console.error('Lecturer seed error:', lErr.message);
  else console.log('✅ Lecturer created/updated in Supabase:', lecturer);

  // 2. Student: Grace Umar
  const { data: student, error: sErr } = await supabase
    .from('profiles')
    .upsert({
      email: 'grace.umar@school.edu',
      password: passwordHash,
      name: 'Grace Umar',
      role: 'student',
      department: 'Computer Engineering',
      admission_year: '2024/2025',
      matric_number: '2024/1/89402CE'
    }, { onConflict: 'email' })
    .select();

  if (sErr) console.error('Student seed error:', sErr.message);
  else console.log('✅ Student created/updated in Supabase:', student);

  console.log('🎉 Supabase Seeding complete!');
}

seedSupabase();
