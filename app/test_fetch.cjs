const fs = require('fs');

// Read .env file for credentials
const envFile = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function testQuery() {
  console.log('Sending direct HTTP POST request to API...');
  
  const timer = setTimeout(() => {
    console.error('HANG DETECTED! Request timed out.');
    process.exit(1);
  }, 10000);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/applications`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        company_name: 'Test Company',
        job_title: 'Test Job',
        status: 'Applied'
      })
    });

    clearTimeout(timer);
    if (!response.ok) {
      const errorData = await response.text();
      console.error('HTTP Error:', response.status, errorData);
    } else {
      const data = await response.json();
      console.log('SUCCESS! Server responded:', data);
    }
  } catch (err) {
    clearTimeout(timer);
    console.error('Fetch failed:', err);
  }
}

testQuery();
