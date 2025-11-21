import { getDbClient, isLibSQLClient } from '../db';
import { randomUUID } from 'crypto';

export interface UserBookingRecord {
  id: string;
  user_id: string;
  booking_id: string;
  guest_email: string;
  created_at: number;
}

export async function saveUserBooking({
  userId,
  bookingId,
  guestEmail,
}: {
  userId: string;
  bookingId: string;
  guestEmail: string;
}) {
  try {
    const db = getDbClient();
    
    if (isLibSQLClient(db)) {
      // Turso/LibSQL (production)
      await db.execute({
        sql: `INSERT OR IGNORE INTO user_bookings (id, user_id, booking_id, guest_email, created_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [randomUUID(), userId, bookingId, guestEmail, Date.now()],
      });
    } else {
      // SQLite (development)
      const stmt = db.prepare(`
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
  } catch (error) {
    console.error('[saveUserBooking] Database error:', error);
    throw error;
  }
}

export async function getUserBookings(userId: string): Promise<UserBookingRecord[]> {
  try {
    const db = getDbClient();
    
    if (isLibSQLClient(db)) {
      // Turso/LibSQL (production)
      const result = await db.execute({
        sql: `SELECT id, user_id, booking_id, guest_email, created_at 
              FROM user_bookings 
              WHERE user_id = ? 
              ORDER BY created_at DESC`,
        args: [userId],
      });
      
      return result.rows.map(row => ({
        id: row.id as string,
        user_id: row.user_id as string,
        booking_id: row.booking_id as string,
        guest_email: row.guest_email as string,
        created_at: row.created_at as number,
      }));
    } else {
      // SQLite (development)
      const stmt = db.prepare(
        `SELECT id, user_id, booking_id, guest_email, created_at 
         FROM user_bookings 
         WHERE user_id = ? 
         ORDER BY created_at DESC`
      );
      return stmt.all(userId) as UserBookingRecord[];
    }
  } catch (error) {
    console.error('[getUserBookings] Database error:', error);
    return [];
  }
}
