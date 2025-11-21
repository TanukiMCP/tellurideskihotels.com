import { createClient, type Client } from '@libsql/client';

let client: Client | null = null;

export function getDbClient(): Client {
  if (!client) {
    const url = import.meta.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
    const authToken = import.meta.env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error('TURSO_DATABASE_URL is not set');
    }

    // For local development, use a local SQLite file
    if (url === 'file:local.db' || url.startsWith('file:')) {
      client = createClient({
        url,
      });
    } else {
      // For production, use Turso cloud database
      if (!authToken) {
        throw new Error('TURSO_AUTH_TOKEN is required for remote database');
      }
      client = createClient({
        url,
        authToken,
      });
    }
  }

  return client;
}

// Initialize database schema
export async function initializeDatabase() {
  const db = getDbClient();

  await db.batch([
    // User table
    `CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL DEFAULT 0,
      name TEXT,
      image TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )`,

    // Session table
    `CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    )`,

    // Account table
    `CREATE TABLE IF NOT EXISTS account (
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
    )`,

    // Verification table
    `CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )`,

    // User bookings table
    `CREATE TABLE IF NOT EXISTS user_bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      booking_id TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )`,

    // Booking access table
    `CREATE TABLE IF NOT EXISTS booking_access (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      email TEXT NOT NULL,
      last_name TEXT,
      user_id TEXT,
      user_type TEXT NOT NULL DEFAULT 'guest',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(booking_id, email)
    )`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_session_token ON session(token)`,
    `CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId)`,
    `CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId)`,
    `CREATE INDEX IF NOT EXISTS idx_user_bookings_user_id ON user_bookings(user_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_bookings_booking_id ON user_bookings(booking_id)`,
    `CREATE INDEX IF NOT EXISTS idx_booking_access_email ON booking_access(email)`,
    `CREATE INDEX IF NOT EXISTS idx_booking_access_booking ON booking_access(booking_id)`,
  ], 'write');

  console.log('✅ Database schema initialized');
}

