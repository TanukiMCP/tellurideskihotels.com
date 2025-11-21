import { getDbClient, isLibSQLClient } from '../db';
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

export async function recordBookingAccess(params: {
  bookingId: string;
  email: string;
  lastName?: string | null;
  userId?: string | null;
  userType?: UserType;
}) {
  const normalizedEmail = params.email.trim().toLowerCase();
  if (!normalizedEmail || !params.bookingId) return;

  try {
    const db = getDbClient();
    const now = Date.now();
    
    if (isLibSQLClient(db)) {
      // Turso/LibSQL (production)
      await db.execute({
        sql: `INSERT INTO booking_access (id, booking_id, email, last_name, user_id, user_type, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(booking_id, email) DO UPDATE SET
                last_name = excluded.last_name,
                user_id = coalesce(excluded.user_id, booking_access.user_id),
                user_type = CASE
                  WHEN excluded.user_id IS NOT NULL THEN 'account'
                  ELSE booking_access.user_type
                END,
                updated_at = excluded.updated_at`,
        args: [
          randomUUID(),
          params.bookingId,
          normalizedEmail,
          params.lastName?.trim().toLowerCase() || null,
          params.userId || null,
          params.userType || (params.userId ? 'account' : 'guest'),
          now,
          now,
        ],
      });
    } else {
      // SQLite (development)
      const stmt = db.prepare(`
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
  } catch (error) {
    console.error('[recordBookingAccess] Database error:', error);
    throw error;
  }
}

export async function findBookingAccessByEmail(email: string): Promise<BookingAccessRecord[]> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return [];

  try {
    const db = getDbClient();
    
    if (isLibSQLClient(db)) {
      // Turso/LibSQL (production)
      const result = await db.execute({
        sql: `SELECT * FROM booking_access WHERE email = ? ORDER BY created_at DESC`,
        args: [normalizedEmail],
      });

      return result.rows.map(row => ({
        id: row.id as string,
        booking_id: row.booking_id as string,
        email: row.email as string,
        last_name: row.last_name as string | null,
        user_id: row.user_id as string | null,
        user_type: row.user_type as UserType,
        created_at: row.created_at as number,
        updated_at: row.updated_at as number,
      }));
    } else {
      // SQLite (development)
      const stmt = db.prepare(
        `SELECT * FROM booking_access WHERE email = ? ORDER BY created_at DESC`
      );
      return stmt.all(normalizedEmail) as BookingAccessRecord[];
    }
  } catch (error) {
    console.error('[findBookingAccessByEmail] Database error:', error);
    return [];
  }
}

export async function bookingBelongsToUser(userId: string, bookingId: string): Promise<boolean> {
  try {
    const db = getDbClient();
    
    if (isLibSQLClient(db)) {
      // Turso/LibSQL (production)
      const result = await db.execute({
        sql: `SELECT 1 FROM booking_access WHERE booking_id = ? AND user_id = ? LIMIT 1`,
        args: [bookingId, userId],
      });
      return result.rows.length > 0;
    } else {
      // SQLite (development)
      const stmt = db.prepare(
        `SELECT 1 FROM booking_access WHERE booking_id = ? AND user_id = ? LIMIT 1`
      );
      const row = stmt.get(bookingId, userId);
      return !!row;
    }
  } catch (error) {
    console.error('[bookingBelongsToUser] Database error:', error);
    return false;
  }
}

export async function claimBookingAccessForUser(email: string, userId: string) {
  const records = await findBookingAccessByEmail(email);
  if (records.length === 0) return;

  const db = getDbClient();
  const now = Date.now();

  for (const record of records) {
    try {
      if (isLibSQLClient(db)) {
        // Turso/LibSQL (production)
        await db.execute({
          sql: `UPDATE booking_access SET user_id = ?, user_type = 'account', updated_at = ? WHERE id = ?`,
          args: [userId, now, record.id],
        });
      } else {
        // SQLite (development)
        const updateStmt = db.prepare(
          `UPDATE booking_access SET user_id = ?, user_type = 'account', updated_at = ? WHERE id = ?`
        );
        updateStmt.run(userId, now, record.id);
      }

      // Also persist to legacy user_bookings table for account dashboards
      await saveUserBooking({
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
