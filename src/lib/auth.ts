import { SignJWT, jwtVerify } from 'jose';
import { getStore } from '@netlify/blobs';

const SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || 'dev-secret-change-in-production-minimum-32-chars'
);

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Session {
  user: User;
  expiresAt: number;
}

// Simple user store using Netlify Blobs
const getUserStore = () => getStore('users');
const getSessionStore = () => getStore('sessions');

export async function createSession(user: User): Promise<string> {
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
  
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(SECRET);

  const sessionStore = getSessionStore();
  await sessionStore.setJSON(token, {
    user,
    expiresAt,
  });

  return token;
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    await jwtVerify(token, SECRET);
    
    const sessionStore = getSessionStore();
    const session = await sessionStore.get(token, { type: 'json' }) as Session | null;
    
    if (!session || session.expiresAt < Date.now()) {
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request: Request): Promise<Session | null> {
  const cookies = request.headers.get('cookie');
  if (!cookies) return null;

  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  if (!tokenMatch) return null;

  return verifySession(tokenMatch[1]);
}

export async function signIn(email: string, password: string): Promise<{ user: User; token: string } | null> {
  const userStore = getUserStore();
  const userKey = `user:${email}`;
  const userData = await userStore.get(userKey, { type: 'json' }) as any;
  
  if (!userData || !verifyPassword(password, userData.passwordHash)) {
    return null;
  }

  const user: User = {
    id: userData.id,
    email: userData.email,
    name: userData.name,
  };

  const token = await createSession(user);
  return { user, token };
}

export async function createUser(email: string, password: string, name: string): Promise<User> {
  const userStore = getUserStore();
  const userKey = `user:${email}`;
  
  const existing = await userStore.get(userKey);
  if (existing) {
    throw new Error('User already exists');
  }

  const user: User = {
    id: Math.random().toString(36).substring(2, 15),
    email,
    name,
  };

  await userStore.setJSON(userKey, {
    ...user,
    passwordHash: hashPassword(password),
  });

  return user;
}

function hashPassword(password: string): string {
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, hash: string): boolean {
  const crypto = require('crypto');
  const [salt, storedHash] = hash.split(':');
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return storedHash === testHash;
}

