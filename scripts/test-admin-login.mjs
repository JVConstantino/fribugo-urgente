#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://friburgourgente-supabase.veuxld.easypanel.host';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...\n');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'friburgourgente.portal@gmail.com',
      password: 'FriburgoUrgente#2026!@#$%'
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Login successful!');
    console.log('User Email:', data.user.email);
    console.log('User ID:', data.user.id);
    console.log('Session Token (first 50 chars):', data.session.access_token.substring(0, 50) + '...');
    console.log('\n✨ Admin can now log in to the application!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testAdminLogin();
