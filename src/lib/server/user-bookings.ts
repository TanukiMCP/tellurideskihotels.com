import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

let db: Database.Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.AUTH_DB_PATH || './auth.db';
    db = new Database(dbPath);
  }
  return db;
}

export interface UserBookingRecord {
  id: string;
  user_id: string;
  booking_id: string;
  guest_email: string;
  created_at: number;
}

export function saveUserBooking({
  userId,
  bookingId,
  guestEmail,
}: {
  userId: string;
  bookingId: string;
  guestEmail: string;
}) {
  const stmt = getDb().prepare(`
    INSERT OR IGNORE INTO user_bookings (id, user_id, booking_id, guest_email, created_at)
    VALUES (@id, @user_id, @booking_id, @guest_email, @created_at)
  `);

  stmt.run({
    id: randomUUID(),
    user_id: userId,
    booking_id: bookingId,
    guest_email: guestEmail,
    created_at: Date.now(),
  });
}

export function getUserBookings(userId: string): UserBookingRecord[] {
  const stmt = getDb().prepare(
    `SELECT id, user_id, booking_id, guest_email, created_at FROM user_bookings WHERE user_id = ? ORDER BY created_at DESC`
  );
  return stmt.all(userId) as UserBookingRecord[];
}

