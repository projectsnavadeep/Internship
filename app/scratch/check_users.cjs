const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read .env file for credentials
const envFile = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_SERVICE_KEY = envFile.match(/VITE_SUPABASE_SERVICE_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function listUsers() {
  console.log('Listing top 5 users...');
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error.message);
    return;
  }

  console.log(JSON.stringify(data.users.slice(0, 5).map(u => ({ id: u.id, email: u.email })), null, 2));
}

listUsers();
