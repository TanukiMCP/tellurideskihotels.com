#!/usr/bin/env tsx
import { createUser } from '../src/lib/auth.js';

// Default admin credentials - CHANGE THESE AFTER FIRST LOGIN!
const DEFAULT_EMAIL = 'admin@tellurideskihotels.com';
const DEFAULT_PASSWORD = 'ChangeMe123!';
const DEFAULT_NAME = 'Administrator';

async function setupAdmin() {
  try {
    const user = await createUser(DEFAULT_EMAIL, DEFAULT_PASSWORD, DEFAULT_NAME);

    console.log('\n✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('Email:    ', DEFAULT_EMAIL);
    console.log('Password: ', DEFAULT_PASSWORD);
    console.log('═══════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT: Change this password after your first login!');
    console.log('\n🌐 Sign in at: http://localhost:4321/admin/login');
    console.log('\nUser ID:', user.id);
  } catch (error: any) {
    if (error.message === 'User already exists') {
      console.log('\n⚠️  Admin user already exists!');
      console.log('Email:', DEFAULT_EMAIL);
      console.log('\nUse this email to sign in at /admin/login');
    } else {
      console.error('\n❌ Error creating admin user:', error);
      process.exit(1);
    }
  }
}

setupAdmin();

