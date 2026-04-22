const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read .env file for credentials
const envFile = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_SERVICE_KEY = envFile.match(/VITE_SUPABASE_SERVICE_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkLogs() {
  console.log('Fetching last 10 error logs...');
  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching logs:', error.message);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

checkLogs();
