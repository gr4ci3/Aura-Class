const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

// Provide WebSocket support for Node.js environments
if (typeof global !== 'undefined' && !global.WebSocket) {
  global.WebSocket = WebSocket;
}

const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : null;
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log('⚡ Connected to Supabase Cloud Database (Primary Engine):', supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Could not initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ️ Supabase credentials not set or placeholder in .env. Using robust local database engine.');
}

module.exports = {
  supabase,
  isSupabaseConfigured: () => Boolean(supabase)
};
