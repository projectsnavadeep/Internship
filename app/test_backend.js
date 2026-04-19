import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBackend() {
  console.log('Testing connection to Supabase...');
  
  // Set a strict 10 second timeout for the test
  const timeoutId = setTimeout(() => {
    console.error('\n❌ ERROR: SUPABASE REQUEST TIMED OUT! THIS MEANS THE RLS INFINITE LOOP IS STILL ACTIVE.');
    console.error('You need to run FINAL_FIX.SQL in your Supabase SQL Editor.');
    process.exit(1);
  }, 10000);

  try {
    // Try to quickly insert a blank record or just read to trigger policies
    const { data, error } = await supabase.from('applications').select('id').limit(1);
    
    clearTimeout(timeoutId);

    if (error) {
      console.error('Response received, but got an error:', error.message);
      return;
    }
    console.log('✅ Connection is fast and healthy! No infinite loop detected here.');
  } catch (err) {
    console.error('Failed completely:', err);
  }
  process.exit(0);
}

testBackend();
