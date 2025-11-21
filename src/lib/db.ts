import { createClient, type Client } from '@libsql/client';
import Database from 'better-sqlite3';

let client: Client | Database.Database | null = null;

export function getDbClient(): Client | Database.Database {
  if (client) return client;

  // Production: Use Turso (LibSQL) for serverless environments
  const tursoUrl = import.meta.env.TURSO_DATABASE_URL;
  const tursoToken = import.meta.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    console.log('[DB] Connecting to Turso database');
    client = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
    return client;
  }

  // Development: Use local SQLite
  console.log('[DB] Using local SQLite database');
  const dbPath = process.env.AUTH_DB_PATH || './auth.db';
  client = new Database(dbPath);
  return client;
}

export function isLibSQLClient(db: Client | Database.Database): db is Client {
  return 'execute' in db;
}

export function isSQLiteClient(db: Client | Database.Database): db is Database.Database {
  return 'prepare' in db;
}

