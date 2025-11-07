import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { randomBytes, scryptSync } from 'crypto';

// Admin credentials
const ADMIN_EMAIL = 'admin@tellurideskihotels.com';
const ADMIN_PASSWORD = 'Voy79262!@#';
const ADMIN_NAME = 'Administrator';

// Secret key to prevent unauthorized access
const SETUP_SECRET = process.env.ADMIN_SETUP_SECRET || 'change-this-secret-key';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Check authorization
    const authHeader = event.headers.authorization || '';
    const providedSecret = authHeader.replace('Bearer ', '');
    
    if (providedSecret !== SETUP_SECRET) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Get the user store
    const userStore = getStore('users');
    const userKey = `user:${ADMIN_EMAIL}`;

    // Check if user already exists
    const existing = await userStore.get(userKey);
    if (existing) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Admin user already exists',
          email: ADMIN_EMAIL,
        }),
      };
    }

    // Create user
    const user = {
      id: randomBytes(16).toString('hex'),
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash: hashPassword(ADMIN_PASSWORD),
    };

    await userStore.setJSON(userKey, user);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Admin user created successfully',
        email: ADMIN_EMAIL,
        userId: user.id,
        loginUrl: 'https://tellurideskihotels.com/admin/login',
      }),
    };
  } catch (error: any) {
    console.error('Error creating admin:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create admin user',
        details: error.message,
      }),
    };
  }
};

