const fs = require('fs');

// Read .env file for credentials
const envFile = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testFull() {
  console.log('Testing authentication and insert...');
  
  const timer = setTimeout(() => {
    console.error('HANG DETECTED! Request timed out.');
    process.exit(1);
  }, 10000);

  try {
    // Generate a random email
    const randEmail = `test${Math.floor(Math.random() * 10000)}@test.com`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: randEmail,
      password: 'password123',
    });

    if (authError) {
       console.log('Auth error:', authError.message);
       clearTimeout(timer);
       process.exit(1);
    }
    
    console.log('User signed up successfully:', authData.user.id);
    
    console.log('Attempting to insert application...');
    const { data, error } = await supabase.from('applications').insert({
        company_name: 'Test Test',
        job_title: 'Engineer',
        status: 'Applied'
    }).select();

    clearTimeout(timer);

    if (error) {
       console.error('Insert Error:', error.message);
    } else {
       console.log('Insert Success!', data);
    }

  } catch (err) {
    clearTimeout(timer);
    console.error('Test failed:', err);
  }
}

testFull();
