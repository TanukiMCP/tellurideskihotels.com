# Turso Database Setup

This project uses Turso (serverless SQLite) for persistent database storage on Netlify.

## Local Development

For local development, the app will use a local SQLite file:

```bash
# Add to your .env file
TURSO_DATABASE_URL=file:local.db
```

No auth token needed for local file-based database.

## Production Setup (Netlify)

### 1. Install Turso CLI

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
irm get.tur.so/install.ps1 | iex
```

### 2. Sign up and authenticate

```bash
turso auth signup
# or if you already have an account
turso auth login
```

### 3. Create a database

```bash
turso db create tellurideskihotels
```

### 4. Get your database URL

```bash
turso db show tellurideskihotels --url
```

Copy the URL (looks like: `libsql://your-db-name-your-org.turso.io`)

### 5. Create an auth token

```bash
turso db tokens create tellurideskihotels
```

Copy the token (long string starting with `eyJ...`)

### 6. Initialize the database schema

```bash
# Set the environment variables temporarily
export TURSO_DATABASE_URL="libsql://your-db-name.turso.io"
export TURSO_AUTH_TOKEN="eyJ..."

# Run the initialization script
npm run init-turso
```

### 7. Add to Netlify

Go to your Netlify site settings → Environment variables and add:

- `TURSO_DATABASE_URL`: Your database URL from step 4
- `TURSO_AUTH_TOKEN`: Your auth token from step 5

### 8. Deploy

```bash
git push
```

Netlify will automatically deploy with the new environment variables.

## Database Schema

The database includes these tables:

- `user_bookings`: Links users to their bookings
- `booking_access`: Tracks who can access which bookings (guest or account)

The schema is automatically created when the app first connects to the database.

## Turso Free Tier

Turso's free tier includes:

- 500 databases
- 9 GB total storage
- 1 billion row reads per month
- 25 million row writes per month

This is more than enough for most applications.

## Troubleshooting

### "TURSO_DATABASE_URL is not set" error

Make sure you've added the environment variables to Netlify and redeployed.

### Database connection errors

1. Check that your auth token is still valid: `turso db tokens list tellurideskihotels`
2. Create a new token if needed: `turso db tokens create tellurideskihotels`
3. Update the token in Netlify environment variables

### Need to reset the database?

```bash
# Delete and recreate
turso db destroy tellurideskihotels
turso db create tellurideskihotels

# Get new credentials
turso db show tellurideskihotels --url
turso db tokens create tellurideskihotels

# Update Netlify environment variables
```

