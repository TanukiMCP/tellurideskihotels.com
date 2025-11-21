# Database Migration: SQLite to Turso

## What Changed

The application previously used local SQLite databases (`better-sqlite3`) which don't work on serverless platforms like Netlify. We've migrated to **Turso**, a serverless SQLite database that works perfectly with Netlify Functions.

## What You Need to Do

### 1. Set up Turso (5 minutes)

Follow the instructions in `TURSO_SETUP.md` to:
- Install Turso CLI
- Create a database
- Get your credentials
- Add them to Netlify

### 2. Add Environment Variables to Netlify

Go to Netlify → Site settings → Environment variables and add:

```
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=eyJ...your-token...
```

### 3. Deploy

```bash
git pull
npm install
git push
```

That's it! The database schema will be automatically created on first connection.

## What Still Uses Netlify Blobs

The authentication system (users, sessions, accounts) still uses Netlify Blobs, which is perfect for that use case. Only the booking-related tables have moved to Turso:

- `user_bookings` - Links users to their bookings
- `booking_access` - Tracks booking access permissions

## Local Development

For local development, just add to your `.env`:

```
TURSO_DATABASE_URL=file:local.db
```

This will create a local SQLite file - no Turso account needed for development!

## Benefits

✅ Works on Netlify's serverless functions
✅ Persistent data across deployments
✅ Fast edge-deployed database
✅ Generous free tier (1B reads/month)
✅ Still using SQLite (no SQL changes needed)

## Troubleshooting

If you see database errors in production:
1. Check that environment variables are set in Netlify
2. Verify your Turso token is still valid
3. Check the Netlify function logs for specific errors

See `TURSO_SETUP.md` for detailed troubleshooting steps.

