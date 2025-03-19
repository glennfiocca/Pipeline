import { Pool, neonConfig } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import ws from 'ws';

// Only use WebSocket in non-edge environment
if (!process.env.VERCEL_ENV) {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Starting database migrations...');

    // Create migrations directory if it doesn't exist
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('Creating migrations directory...');
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Get all SQL files from the migrations directory
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Execute in alphabetical order

    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }

    // Execute each migration file
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute the SQL
      await pool.query(sql);
      console.log(`Migration ${file} completed successfully.`);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations(); 