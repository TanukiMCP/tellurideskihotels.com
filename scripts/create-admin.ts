#!/usr/bin/env tsx
import Database from 'better-sqlite3';
import { randomBytes, scryptSync } from 'crypto';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function createAdmin() {
  console.log('\n=== Create Admin User ===\n');

  const email = await question('Email: ');
  const password = await question('Password: ');
  const name = await question('Full Name: ');

  if (!email || !password) {
    console.error('Email and password are required');
    process.exit(1);
  }

  const db = new Database('./auth.db');

  try {
    // Check if user exists
    const existing = db.prepare('SELECT * FROM user WHERE email = ?').get(email);
    if (existing) {
      console.error('\n❌ User with this email already exists');
      process.exit(1);
    }

    // Create user
    const userId = randomBytes(16).toString('hex');
    const now = Date.now();
    
    db.prepare(`
      INSERT INTO user (id, email, emailVerified, name, createdAt, updatedAt)
      VALUES (?, ?, 0, ?, ?, ?)
    `).run(userId, email, name, now, now);

    // Create account with password
    const accountId = randomBytes(16).toString('hex');
    const hashedPassword = hashPassword(password);
    
    db.prepare(`
      INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt)
      VALUES (?, ?, ?, 'credential', ?, ?, ?)
    `).run(accountId, userId, email, hashedPassword, now, now);

    console.log('\n✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('User ID:', userId);
    console.log('\nYou can now sign in at: /admin/login');
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    db.close();
    rl.close();
  }
}

createAdmin();

