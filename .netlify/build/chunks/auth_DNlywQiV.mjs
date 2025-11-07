import { jwtVerify, SignJWT } from 'jose';
import { getStore } from '@netlify/blobs';

const SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production-minimum-32-chars"
);
const getUserStore = () => getStore("users");
const getSessionStore = () => getStore("sessions");
async function createSession(user) {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1e3;
  const token = await new SignJWT({ userId: user.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").setIssuedAt().sign(SECRET);
  const sessionStore = getSessionStore();
  await sessionStore.setJSON(token, {
    user,
    expiresAt
  });
  return token;
}
async function verifySession(token) {
  try {
    await jwtVerify(token, SECRET);
    const sessionStore = getSessionStore();
    const session = await sessionStore.get(token, { type: "json" });
    if (!session || session.expiresAt < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}
async function getSessionFromRequest(request) {
  const cookies = request.headers.get("cookie");
  if (!cookies) return null;
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  if (!tokenMatch) return null;
  return verifySession(tokenMatch[1]);
}
async function signIn(email, password) {
  const userStore = getUserStore();
  const userKey = `user:${email}`;
  const userData = await userStore.get(userKey, { type: "json" });
  if (!userData || !verifyPassword(password, userData.passwordHash)) {
    return null;
  }
  const user = {
    id: userData.id,
    email: userData.email,
    name: userData.name
  };
  const token = await createSession(user);
  return { user, token };
}
async function createUser(email, password, name) {
  const userStore = getUserStore();
  const userKey = `user:${email}`;
  const existing = await userStore.get(userKey);
  if (existing) {
    throw new Error("User already exists");
  }
  const user = {
    id: Math.random().toString(36).substring(2, 15),
    email,
    name
  };
  await userStore.setJSON(userKey, {
    ...user,
    passwordHash: hashPassword(password)
  });
  return user;
}
function hashPassword(password) {
  const crypto = require("crypto");
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, hash) {
  const crypto = require("crypto");
  const [salt, storedHash] = hash.split(":");
  const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return storedHash === testHash;
}

export { createUser as c, getSessionFromRequest as g, signIn as s };
