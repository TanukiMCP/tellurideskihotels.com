#!/usr/bin/env tsx
/**
 * Create admin user in Netlify Blobs (production)
 * This script creates an admin user directly in Netlify's production environment
 */

import { getStore } from '@netlify/blobs';
import { randomBytes, scryptSync } from 'crypto';

// Admin credentials
const ADMIN_EMAIL = 'admin@tellurideskihotels.com';
const ADMIN_PASSWORD = 'Voy79262!@#';
const ADMIN_NAME = 'Administrator';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function createNetlifyAdmin() {
  try {
    console.log('\n🔧 Creating admin user in Netlify Blobs...\n');

    // Try to use Netlify's automatic configuration first
    let userStore;
    try {
      // When running in Netlify context (deploy or netlify dev), this will work automatically
      userStore = getStore('users');
      console.log('✓ Using Netlify automatic configuration');
    } catch (error) {
      // Fallback to manual configuration
      if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_AUTH_TOKEN) {
        console.error('❌ Not in Netlify context and missing required environment variables:');
        console.error('   - NETLIFY_SITE_ID');
        console.error('   - NETLIFY_AUTH_TOKEN');
        console.error('\nRun this script using: netlify blobs:exec scripts/create-netlify-admin.ts');
        process.exit(1);
      }

      userStore = getStore({
        name: 'users',
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN,
      });
      console.log('✓ Using manual configuration');
    }

    const userKey = `user:${ADMIN_EMAIL}`;

    // Check if user already exists
    const existing = await userStore.get(userKey);
    if (existing) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email:', ADMIN_EMAIL);
      console.log('\nUse this email to sign in at https://tellurideskihotels.com/admin/login');
      process.exit(0);
    }

    // Create user
    const user = {
      id: randomBytes(16).toString('hex'),
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash: hashPassword(ADMIN_PASSWORD),
    };

    await userStore.setJSON(userKey, user);

    console.log('✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('Email:    ', ADMIN_EMAIL);
    console.log('Password: ', ADMIN_PASSWORD);
    console.log('═══════════════════════════════════════');
    console.log('\n🌐 Sign in at: https://tellurideskihotels.com/admin/login');
    console.log('\nUser ID:', user.id);
    console.log('\n⚠️  IMPORTANT: Keep these credentials secure!');
  } catch (error: any) {
    console.error('\n❌ Error creating admin user:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

createNetlifyAdmin();

