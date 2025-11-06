#!/usr/bin/env tsx
import Database from 'better-sqlite3';
import { randomBytes, scryptSync } from 'crypto';

// Default admin credentials - CHANGE THESE AFTER FIRST LOGIN!
const DEFAULT_EMAIL = 'admin@tellurideskihotels.com';
const DEFAULT_PASSWORD = 'ChangeMe123!';
const DEFAULT_NAME = 'Administrator';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function setupAdmin() {
  const db = new Database('./auth.db');

  try {
    // Check if user exists
    const existing = db.prepare('SELECT * FROM user WHERE email = ?').get(DEFAULT_EMAIL);
    if (existing) {
      console.log('\n⚠️  Admin user already exists!');
      console.log('Email:', DEFAULT_EMAIL);
      console.log('\nUse this email to sign in at /admin/login');
      process.exit(0);
    }

    // Create user
    const userId = randomBytes(16).toString('hex');
    const now = Date.now();
    
    db.prepare(`
      INSERT INTO user (id, email, emailVerified, name, createdAt, updatedAt)
      VALUES (?, ?, 0, ?, ?, ?)
    `).run(userId, DEFAULT_EMAIL, DEFAULT_NAME, now, now);

    // Create account with password
    const accountId = randomBytes(16).toString('hex');
    const hashedPassword = hashPassword(DEFAULT_PASSWORD);
    
    db.prepare(`
      INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt)
      VALUES (?, ?, ?, 'credential', ?, ?, ?)
    `).run(accountId, userId, DEFAULT_EMAIL, hashedPassword, now, now);

    console.log('\n✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('Email:    ', DEFAULT_EMAIL);
    console.log('Password: ', DEFAULT_PASSWORD);
    console.log('═══════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT: Change this password after your first login!');
    console.log('\n🌐 Sign in at: http://localhost:4321/admin/login');
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

setupAdmin();

