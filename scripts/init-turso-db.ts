#!/usr/bin/env tsx
/**
 * Initialize Turso database schema for production
 * 
 * Usage:
 *   TURSO_DATABASE_URL=<url> TURSO_AUTH_TOKEN=<token> tsx scripts/init-turso-db.ts
 */

import { createClient } from '@libsql/client';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required');
  console.error('\nUsage:');
  console.error('  TURSO_DATABASE_URL=<url> TURSO_AUTH_TOKEN=<token> tsx scripts/init-turso-db.ts');
  process.exit(1);
}

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function initializeDatabase() {
  console.log('🚀 Initializing Turso database schema...\n');

  try {
    // Create user table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        emailVerified INTEGER NOT NULL DEFAULT 0,
        name TEXT,
        image TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);
    console.log('✅ Created user table');

    // Create session table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        ipAddress TEXT,
        userAgent TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created session table');

    // Create account table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        accountId TEXT NOT NULL,
        providerId TEXT NOT NULL,
        accessToken TEXT,
        refreshToken TEXT,
        expiresAt INTEGER,
        password TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created account table');

    // Create verification table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);
    console.log('✅ Created verification table');

    // Create user_bookings table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_bookings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        booking_id TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created user_bookings table');

    // Create booking_access table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS booking_access (
        id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL,
        email TEXT NOT NULL,
        last_name TEXT,
        user_id TEXT,
        user_type TEXT NOT NULL DEFAULT 'guest',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(booking_id, email)
      )
    `);
    console.log('✅ Created booking_access table');

    // Create indexes
    await client.execute('CREATE INDEX IF NOT EXISTS idx_session_token ON session(token)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_user_bookings_user_id ON user_bookings(user_id)');
    await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_bookings_booking_id ON user_bookings(booking_id)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_booking_access_email ON booking_access(email)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_booking_access_booking ON booking_access(booking_id)');
    console.log('✅ Created all indexes');

    console.log('\n✨ Database initialized successfully!');
    console.log('📍 Database URL:', TURSO_DATABASE_URL);
    console.log('\n🎉 Your Turso database is ready for production!');
  } catch (error) {
    console.error('\n❌ Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();

