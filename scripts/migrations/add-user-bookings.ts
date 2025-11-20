#!/usr/bin/env tsx
import Database from 'better-sqlite3';

const db = new Database('./auth.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS user_bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    booking_id TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_user_bookings_user_id ON user_bookings(user_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_user_bookings_booking_id ON user_bookings(booking_id);
`);

console.log('✅ user_bookings table migration complete');

