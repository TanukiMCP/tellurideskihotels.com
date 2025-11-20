import { SignJWT, jwtVerify } from 'jose';
import { getStore } from '@netlify/blobs';
import { randomBytes, randomUUID, scryptSync } from 'crypto';
import { Resend } from 'resend';
import { claimBookingAccessForUser } from './server/booking-access';

const SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || 'dev-secret-change-in-production-minimum-32-chars'
);
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://tellurideskihotels.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL =
  process.env.FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'bookings@tellurideskihotels.com';
const EMAIL_VERIFICATION_TTL = 1000 * 60 * 60 * 24; // 24h

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export type UserType = 'account' | 'guest';
export type OAuthProvider = 'google' | 'apple' | null;

export interface User {
  id: string;
  email: string;
  name?: string;
  type: UserType;
  emailVerified: boolean;
  createdAt: number;
  oauthProvider?: OAuthProvider;
  oauthId?: string;
  image?: string;
}

export interface Session {
  user: User;
  expiresAt: number;
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code: string = 'AUTH_ERROR'
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Simple user + verification store using Netlify Blobs
const getUserStore = () => getStore('users');
const getSessionStore = () => getStore('sessions');
const getVerificationStore = () => getStore('user-verifications');

interface StoredUser extends User {
  passwordHash?: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildUser(data: StoredUser): User {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    type: data.type || 'account',
    emailVerified: Boolean(data.emailVerified),
    createdAt: data.createdAt || Date.now(),
  };
}

async function getStoredUser(email: string): Promise<StoredUser | null> {
  const userStore = getUserStore();
  const userKey = `user:${normalizeEmail(email)}`;
  const data = (await userStore.get(userKey, { type: 'json' })) as StoredUser | null;
  return data || null;
}

async function persistStoredUser(user: StoredUser) {
  const userStore = getUserStore();
  const userKey = `user:${user.email}`;
  await userStore.setJSON(userKey, user);
}

export async function createSession(user: User): Promise<string> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

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
    const session = (await sessionStore.get(token, { type: 'json' })) as Session | null;
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

export async function signIn(email: string, password: string): Promise<{ user: User; token: string }> {
  const stored = await getStoredUser(email);
  
  if (!stored) {
    throw new AuthenticationError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // OAuth users don't have passwords
  if (stored.oauthProvider) {
    throw new AuthenticationError(
      `Please sign in with ${stored.oauthProvider === 'google' ? 'Google' : 'Apple'}`,
      403,
      'USE_OAUTH'
    );
  }

  if (!stored.passwordHash || !verifyPassword(password, stored.passwordHash)) {
    throw new AuthenticationError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  if (stored.type !== 'account') {
    throw new AuthenticationError('Account type cannot sign in', 403, 'UNSUPPORTED_USER');
  }

  if (!stored.emailVerified) {
    throw new AuthenticationError('Email not verified', 403, 'EMAIL_NOT_VERIFIED');
  }

  const user = buildUser(stored);
  const token = await createSession(user);
  return { user, token };
}

interface CreateUserOptions {
  type?: UserType;
  emailVerified?: boolean;
  skipVerificationEmail?: boolean;
  oauthProvider?: OAuthProvider;
  oauthId?: string;
  image?: string;
}

export async function createUser(
  email: string,
  password: string | null,
  name: string,
  options: CreateUserOptions = {}
): Promise<User> {
  const normalizedEmail = normalizeEmail(email);
  const userStore = getUserStore();
  const userKey = `user:${normalizedEmail}`;

  const existing = await userStore.get(userKey);
  if (existing) {
    throw new AuthenticationError('User already exists', 409, 'USER_EXISTS');
  }

  const user: StoredUser = {
    id: randomUUID(),
    email: normalizedEmail,
    name,
    type: options.type || 'account',
    emailVerified: Boolean(options.emailVerified || options.oauthProvider), // OAuth users are auto-verified
    createdAt: Date.now(),
    passwordHash: password ? hashPassword(password) : undefined,
    oauthProvider: options.oauthProvider,
    oauthId: options.oauthId,
    image: options.image,
  };

  await userStore.setJSON(userKey, user);

  if (user.type === 'account' && !user.emailVerified && !options.skipVerificationEmail) {
    await queueVerificationEmail(buildUser(user));
  }

  return buildUser(user);
}

async function queueVerificationEmail(user: User) {
  const token = randomUUID();
  const verificationStore = getVerificationStore();
  await verificationStore.setJSON(`verify:${token}`, {
    userId: user.id,
    email: user.email,
    expiresAt: Date.now() + EMAIL_VERIFICATION_TTL,
  });

  if (!resend) {
    console.warn('[auth] RESEND_API_KEY missing, verification link:', token);
    return token;
  }

  const verificationUrl = new URL('/account/verify', SITE_URL);
  verificationUrl.searchParams.set('token', token);

  await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: user.email,
    subject: 'Verify your Telluride Ski Hotels account',
    html: `
      <p>Hi ${user.name || 'there'},</p>
      <p>Thanks for creating an account with Telluride Ski Hotels. Confirm your email to unlock saved bookings across devices.</p>
      <p><a href="${verificationUrl.toString()}" target="_blank">Verify email</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });

  return token;
}

export async function requestEmailVerification(email: string) {
  const stored = await getStoredUser(email);
  if (!stored) {
    throw new AuthenticationError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (stored.emailVerified) {
    return buildUser(stored);
  }

  return queueVerificationEmail(buildUser(stored));
}

export async function verifyEmailToken(token: string): Promise<User> {
  const verificationStore = getVerificationStore();
  const record = (await verificationStore.get(`verify:${token}`, {
    type: 'json',
  })) as { email: string; userId: string; expiresAt: number } | null;

  if (!record) {
    throw new AuthenticationError('Verification link is invalid', 410, 'TOKEN_INVALID');
  }

  if (record.expiresAt < Date.now()) {
    await verificationStore.delete(`verify:${token}`);
    throw new AuthenticationError('Verification link has expired', 410, 'TOKEN_EXPIRED');
  }

  const stored = await getStoredUser(record.email);
  if (!stored || stored.id !== record.userId) {
    throw new AuthenticationError('User not found for verification token', 404, 'USER_NOT_FOUND');
  }

  if (!stored.emailVerified) {
    stored.emailVerified = true;
    await persistStoredUser(stored);
    await claimBookingAccessForUser(stored.email, stored.id);
  }

  await verificationStore.delete(`verify:${token}`);
  return buildUser(stored);
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(':');
  const testHash = scryptSync(password, salt, 64).toString('hex');
  return storedHash === testHash;
}

// OAuth functions
export async function findOrCreateOAuthUser(
  email: string,
  name: string,
  provider: OAuthProvider,
  oauthId: string,
  image?: string
): Promise<{ user: User; token: string; isNewUser: boolean }> {
  const normalizedEmail = normalizeEmail(email);
  let stored = await getStoredUser(normalizedEmail);
  let isNewUser = false;

  if (!stored) {
    // Create new OAuth user
    const newUser = await createUser(normalizedEmail, null, name, {
      emailVerified: true,
      oauthProvider: provider,
      oauthId,
      image,
    });
    stored = await getStoredUser(normalizedEmail);
    isNewUser = true;
  } else if (!stored.oauthProvider) {
    // Link OAuth to existing email/password account
    stored.oauthProvider = provider;
    stored.oauthId = oauthId;
    if (image && !stored.image) {
      stored.image = image;
    }
    if (!stored.emailVerified) {
      stored.emailVerified = true;
    }
    await persistStoredUser(stored);
  }

  const user = buildUser(stored!);
  const token = await createSession(user);

  // Claim any guest bookings when OAuth user signs up
  if (isNewUser) {
    await claimBookingAccessForUser(normalizedEmail, user.id);
  }

  return { user, token, isNewUser };
}

