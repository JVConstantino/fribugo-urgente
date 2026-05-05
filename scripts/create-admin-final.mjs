#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://friburgourgente-supabase.veuxld.easypanel.host';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createAdmin() {
  try {
    console.log('🔧 Setting up admin user...\n');

    // Step 1: List all users to find the existing one
    console.log('1️⃣ Checking existing users...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const existingUser = users.users.find(u => u.email === 'friburgourgente.portal@gmail.com');
    
    if (existingUser) {
      console.log('   ✓ Found existing user:', existingUser.id);
      console.log('   Email confirmed:', existingUser.email_confirmed_at ? 'Yes' : 'No');
      console.log('   User metadata:', existingUser.user_metadata);
      
      // Try to delete it
      console.log('\n2️⃣ Deleting existing user...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
      
      if (deleteError) {
        console.error('   ❌ Error deleting user:', deleteError.message);
        return;
      }
      console.log('   ✓ User deleted');
    }

    // Step 2: Create new user
    console.log('\n3️⃣ Creating new admin user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'friburgourgente.portal@gmail.com',
      password: 'FriburgoUrgente#2026!@#$%',
      email_confirm: true,
      user_metadata: {
        name: 'Admin Friburgo Urgente',
        role: 'admin'
      }
    });

    if (createError) {
      console.error('   ❌ Error:', createError.message);
      return;
    }

    console.log('   ✓ User created successfully!');
    console.log('   ID:', newUser.user.id);
    console.log('   Email:', newUser.user.email);

    // Step 3: Test login
    console.log('\n4️⃣ Testing login...');
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
    const anonClient = createClient(SUPABASE_URL, ANON_KEY);

    const { data: session, error: loginError } = await anonClient.auth.signInWithPassword({
      email: 'friburgourgente.portal@gmail.com',
      password: 'FriburgoUrgente#2026!@#$%'
    });

    if (loginError) {
      console.error('   ❌ Login failed:', loginError.message);
      return;
    }

    console.log('   ✓ Login works!');
    console.log('   Session created:', session.session ? 'Yes' : 'No');

    console.log('\n✅ Admin setup complete!\n');
    console.log('📧 Credentials:');
    console.log('   Email: friburgourgente.portal@gmail.com');
    console.log('   Password: FriburgoUrgente#2026!@#$%');
    console.log('\n🎉 Ready to log in to the application!');
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

createAdmin();
