import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { nextCookies } from "better-auth/next-js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/uploadhaven";

// Create MongoDB client for BetterAuth
const client = new MongoClient(MONGODB_URI);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db),

  // Base URL for Better Auth
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000",

  // Secret for signing tokens
  secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-for-development",

  // Enable email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieName: "uploadhaven.session_token", // Explicit cookie name
  },

  // Cookie configuration
  advanced: {
    cookiePrefix: "uploadhaven",
  },

  // User configuration
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
    },  },

  // Plugins
  plugins: [
    nextCookies(), // Must be the last plugin
  ],
});
