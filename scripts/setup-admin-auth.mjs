#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://friburgourgente-supabase.veuxld.easypanel.host';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setupAdminAuth() {
  try {
    console.log('🔧 Setting up admin authentication...\n');

    // First, delete any existing user with this email
    console.log('1️⃣ Removing any existing user...');
    try {
      const { data: existingUser } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', 'friburgourgente.portal@gmail.com')
        .single();
      
      if (existingUser?.id) {
        await supabase.auth.admin.deleteUser(existingUser.id);
        console.log('   ✓ Removed existing user');
      }
    } catch (e) {
      // User doesn't exist, continue
    }

    // Create new admin user with email confirmation
    console.log('2️⃣ Creating new admin user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'friburgourgente.portal@gmail.com',
      password: 'FriburgoUrgente#2026!@#$%',
      email_confirm: true,
      user_metadata: {
        name: 'Admin Friburgo Urgente',
        role: 'admin'
      }
    });

    if (error) {
      console.error('❌ Error creating user:', error.message);
      process.exit(1);
    }

    console.log('   ✓ User created');
    console.log(`   ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);

    // Test login immediately
    console.log('\n3️⃣ Testing login...');
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
    const anonClient = createClient(SUPABASE_URL, ANON_KEY);
    
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: 'friburgourgente.portal@gmail.com',
      password: 'FriburgoUrgente#2026!@#$%'
    });

    if (authError) {
      console.error('❌ Login test failed:', authError.message);
      process.exit(1);
    }

    console.log('   ✓ Login successful');
    console.log(`   Session expires at: ${new Date(authData.session.expires_at * 1000).toISOString()}`);

    console.log('\n✅ Admin authentication setup complete!');
    console.log('\n📧 Credentials:');
    console.log('   Email: friburgourgente.portal@gmail.com');
    console.log('   Password: FriburgoUrgente#2026!@#$%');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setupAdminAuth();
