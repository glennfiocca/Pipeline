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
  maxConnections: 20,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  maxUses: 7500, // Close connections after too many uses
  retryInterval: 100, // Time between connection retries
  maxLifetimeSeconds: 3600, // Close connections after one hour
});

// Add error handler for the pool
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const db = drizzle({ client: pool, schema });

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