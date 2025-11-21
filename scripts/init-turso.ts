#!/usr/bin/env tsx
import { initializeDatabase } from '../src/lib/db';

async function main() {
  try {
    console.log('🔄 Initializing Turso database schema...');
    await initializeDatabase();
    console.log('✅ Database schema initialized successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Set TURSO_DATABASE_URL in your .env file');
    console.log('2. Set TURSO_AUTH_TOKEN in your .env file');
    console.log('3. Add these same variables to Netlify environment variables');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

main();

