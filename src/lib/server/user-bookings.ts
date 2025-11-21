import { getDbClient } from '../db';
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
    await db.execute({
      sql: `INSERT OR IGNORE INTO user_bookings (id, user_id, booking_id, guest_email, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [randomUUID(), userId, bookingId, guestEmail, Date.now()],
    });
  } catch (error) {
    console.error('[saveUserBooking] Database error:', error);
    throw error;
  }
}

export async function getUserBookings(userId: string): Promise<UserBookingRecord[]> {
  try {
    const db = getDbClient();
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
  } catch (error) {
    console.error('[getUserBookings] Database error:', error);
    return [];
  }
}

