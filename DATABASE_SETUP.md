# Production Database Setup Guide

This application uses **Turso** (LibSQL) for production database storage in serverless environments like Netlify.

## Why Turso?

- ✅ **Serverless-native**: Works perfectly with Netlify Functions
- ✅ **SQLite-compatible**: Easy migration from local development
- ✅ **Global edge replication**: Fast worldwide
- ✅ **Free tier**: Generous limits for most applications
- ✅ **Low latency**: Sub-10ms queries

## Setup Instructions

### 1. Create a Turso Account

1. Sign up at [turso.tech](https://turso.tech)
2. Install the Turso CLI:
   ```bash
   # macOS/Linux
   curl -sSfL https://get.tur.so/install.sh | bash
   
   # Windows (PowerShell)
   irm https://get.tur.so/install.ps1 | iex
   ```

### 2. Create Your Database

```bash
# Login to Turso
turso auth login

# Create a new database
turso db create telluride-ski-hotels

# Get your database URL
turso db show telluride-ski-hotels --url

# Create an auth token
turso db tokens create telluride-ski-hotels
```

### 3. Initialize the Database Schema

Run the initialization script with your Turso credentials:

```bash
TURSO_DATABASE_URL="libsql://your-db.turso.io" \
TURSO_AUTH_TOKEN="your-token-here" \
npm run init-turso-db
```

Or using the Turso CLI directly:

```bash
turso db shell telluride-ski-hotels < scripts/init-turso-db.sql
```

### 4. Configure Environment Variables

#### Local Development (.env)

```env
# Optional: Use local SQLite for development
AUTH_DB_PATH=./auth.db

# Or use Turso for development too
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token-here
```

#### Production (Netlify)

Add these environment variables in your Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add the following variables:

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token-here
```

## Database Schema

### Tables

#### `user_bookings`
Stores the relationship between users and their bookings.

```sql
CREATE TABLE user_bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

#### `booking_access`
Tracks booking access for both guest and account users.

```sql
CREATE TABLE booking_access (
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
```

#### Other Tables
- `user`: User accounts
- `session`: Active sessions
- `account`: OAuth account links
- `verification`: Email verification tokens

## Development Workflow

### Local Development

The app automatically uses local SQLite when Turso credentials are not provided:

```bash
# Initialize local database
npm run init-db

# Start development server
npm run dev
```

### Production Deployment

1. Ensure Turso environment variables are set in Netlify
2. Deploy your code:
   ```bash
   git push origin main
   ```
3. Netlify will automatically deploy with Turso database

## Monitoring & Management

### View Database Contents

```bash
# Open interactive shell
turso db shell telluride-ski-hotels

# Run queries
SELECT * FROM user_bookings LIMIT 10;
SELECT * FROM booking_access WHERE user_type = 'account';
```

### Database Metrics

```bash
# View database stats
turso db show telluride-ski-hotels

# View usage
turso db usage telluride-ski-hotels
```

### Backup & Restore

Turso automatically backs up your database. To create manual backups:

```bash
# Create a snapshot
turso db snapshot telluride-ski-hotels

# List snapshots
turso db snapshots telluride-ski-hotels
```

## Troubleshooting

### "Database not found" errors

- Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set correctly
- Check that the database exists: `turso db list`
- Ensure the auth token is valid: `turso db tokens list telluride-ski-hotels`

### "Table does not exist" errors

- Run the initialization script: `npm run init-turso-db`
- Or manually run the SQL schema in the Turso shell

### Connection timeouts

- Check your network connection
- Verify the database URL is correct
- Try creating a new auth token

## Migration from SQLite

If you have existing data in a local SQLite database:

```bash
# Dump your local database
sqlite3 auth.db .dump > backup.sql

# Import into Turso
turso db shell telluride-ski-hotels < backup.sql
```

## Cost & Limits

Turso's free tier includes:
- 9 GB total storage
- 1 billion row reads per month
- 25 million row writes per month
- 3 databases
- 3 locations per database

This is more than sufficient for most applications. See [turso.tech/pricing](https://turso.tech/pricing) for details.

## Support

- Turso Documentation: [docs.turso.tech](https://docs.turso.tech)
- Turso Discord: [discord.gg/turso](https://discord.gg/turso)
- LibSQL Client Docs: [github.com/libsql/libsql-client-ts](https://github.com/libsql/libsql-client-ts)

