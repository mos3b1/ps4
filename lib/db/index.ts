import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Ensure DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error("[DB ERROR] DATABASE_URL is not set!");
  console.error("[DB ERROR] Make sure .env.local exists with DATABASE_URL=...");
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export * from "./schema";
