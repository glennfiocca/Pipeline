import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Only use WebSocket in non-edge environment (local development)
if (!process.env.VERCEL_ENV) {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with proper settings for reliability
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
  maxUses: 7500, // Close connections after too many uses
  allowExitOnIdle: true
});

// Add error handler for the pool
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const db = drizzle({ client: pool, schema });

// Function to create the referral_codes table if it doesn't exist
export async function createReferralCodesTable() {
  try {
    console.log('Creating referral_codes table if it does not exist...');
    
    // Create the referral_codes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "referral_codes" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "code" TEXT NOT NULL UNIQUE,
        "created_at" TEXT NOT NULL DEFAULT NOW(),
        "usage_count" INTEGER NOT NULL DEFAULT 0
      );
      
      -- Create index on user_id for faster lookups
      CREATE INDEX IF NOT EXISTS "referral_codes_user_id_idx" ON "referral_codes" ("user_id");
      
      -- Create index on code for faster lookups
      CREATE INDEX IF NOT EXISTS "referral_codes_code_idx" ON "referral_codes" ("code");
    `);
    
    console.log('Referral codes table created or already exists.');
    return true;
  } catch (error) {
    console.error('Error creating referral_codes table:', error);
    return false;
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Closing pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT. Closing pool...');
  await pool.end();
  process.exit(0);
});