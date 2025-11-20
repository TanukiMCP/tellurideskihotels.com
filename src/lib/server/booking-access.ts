import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { saveUserBooking } from './user-bookings';

type UserType = 'guest' | 'account';

interface BookingAccessRecord {
  id: string;
  booking_id: string;
  email: string;
  last_name?: string | null;
  user_id?: string | null;
  user_type: UserType;
  created_at: number;
  updated_at: number;
}

let db: Database.Database | null = null;
let initialized = false;

function getDb() {
  if (!db) {
    const dbPath = process.env.AUTH_DB_PATH || './auth.db';
    db = new Database(dbPath);
  }

  if (!initialized) {
    db.exec(`
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
      );

      CREATE INDEX IF NOT EXISTS idx_booking_access_email ON booking_access(email);
      CREATE INDEX IF NOT EXISTS idx_booking_access_booking ON booking_access(booking_id);
    `);

    initialized = true;
  }

  return db;
}

export function recordBookingAccess(params: {
  bookingId: string;
  email: string;
  lastName?: string | null;
  userId?: string | null;
  userType?: UserType;
}) {
  const normalizedEmail = params.email.trim().toLowerCase();
  if (!normalizedEmail || !params.bookingId) return;

  const now = Date.now();
  const stmt = getDb().prepare(`
    INSERT INTO booking_access (id, booking_id, email, last_name, user_id, user_type, created_at, updated_at)
    VALUES (@id, @booking_id, @email, @last_name, @user_id, @user_type, @created_at, @updated_at)
    ON CONFLICT(booking_id, email) DO UPDATE SET
      last_name = excluded.last_name,
      user_id = coalesce(excluded.user_id, booking_access.user_id),
      user_type = CASE
        WHEN excluded.user_id IS NOT NULL THEN 'account'
        ELSE booking_access.user_type
      END,
      updated_at = excluded.updated_at
  `);

  stmt.run({
    id: randomUUID(),
    booking_id: params.bookingId,
    email: normalizedEmail,
    last_name: params.lastName?.trim().toLowerCase() || null,
    user_id: params.userId || null,
    user_type: params.userType || (params.userId ? 'account' : 'guest'),
    created_at: now,
    updated_at: now,
  });
}

export function findBookingAccessByEmail(email: string): BookingAccessRecord[] {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return [];

  const stmt = getDb().prepare(
    `SELECT * FROM booking_access WHERE email = ? ORDER BY created_at DESC`
  );

  return stmt.all(normalizedEmail) as BookingAccessRecord[];
}

export function bookingBelongsToUser(userId: string, bookingId: string): boolean {
  const stmt = getDb().prepare(
    `SELECT 1 FROM booking_access WHERE booking_id = ? AND user_id = ? LIMIT 1`
  );

  const row = stmt.get(bookingId, userId);
  return !!row;
}

export function claimBookingAccessForUser(email: string, userId: string) {
  const records = findBookingAccessByEmail(email);
  if (records.length === 0) return;

  const updateStmt = getDb().prepare(
    `UPDATE booking_access SET user_id = ?, user_type = 'account', updated_at = ? WHERE id = ?`
  );

  const now = Date.now();

  for (const record of records) {
    updateStmt.run(userId, now, record.id);

    // Also persist to legacy user_bookings table for account dashboards
    try {
      saveUserBooking({
        userId,
        bookingId: record.booking_id,
        guestEmail: record.email,
      });
    } catch (error) {
      console.error('[booking-access] Failed to sync booking to user_bookings', {
        bookingId: record.booking_id,
        error,
      });
    }
  }
}


