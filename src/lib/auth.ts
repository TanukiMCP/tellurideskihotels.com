import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

const db = new Database("./auth.db");

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [
    "http://localhost:4321",
    "http://localhost:8080",
    "https://tellurideskihotels.com",
  ],
});

export type Session = typeof auth.$Infer.Session;

