import { readFileSync } from "fs";

// Vercel production build config - uses .mjs to avoid importing drizzle-kit types
// This file is only used for drizzle-kit CLI commands, not runtime
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  try {
    const envFile = readFileSync(".env.local", "utf8");
    const match = envFile.match(/DATABASE_URL=(.+)/);
    if (match) {
      databaseUrl = match[1].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // .env.local doesn't exist
  }
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL not found in environment or .env.local file");
}

/** @type {import("drizzle-kit").Config} */
export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
};
