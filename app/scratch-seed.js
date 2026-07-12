import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mtcugjtuiuxjgoyvzzvf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10Y3VnanR1aXV4amdveXZ6enZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzI1MTAsImV4cCI6MjA5ODQwODUxMH0.HM0th_IykwAyK2smIbV96LmQ2oEpwPIPjchZaj8STYI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seed() {
  console.log('Seeding user...');
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'P@ssword123',
  });
  
  if (error) {
    console.error('Error signing up:', error.message);
  } else {
    console.log('User signed up successfully:', data.user?.email);
  }
}

seed();
