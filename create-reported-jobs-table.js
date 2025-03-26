import pg from 'pg';
const { Pool } = pg;

// Use the database connection string from environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createReportedJobsTable() {
  try {
    console.log('Creating reported_jobs table if it does not exist...');
    
    // Create the reported_jobs table
    await pool.query(`
      -- Create the reported_jobs table to track user reports for job listings
      CREATE TABLE IF NOT EXISTS "reported_jobs" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "job_id" INTEGER NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
        "reason" TEXT NOT NULL,
        "comments" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "created_at" TEXT NOT NULL DEFAULT NOW(),
        "reviewed_at" TEXT,
        "reviewed_by" INTEGER REFERENCES "users"("id"),
        "admin_notes" TEXT
      );
      
      -- Create index on user_id for faster lookups
      CREATE INDEX IF NOT EXISTS "reported_jobs_user_id_idx" ON "reported_jobs" ("user_id");
      
      -- Create index on job_id for faster lookups
      CREATE INDEX IF NOT EXISTS "reported_jobs_job_id_idx" ON "reported_jobs" ("job_id");
      
      -- Create index on status for faster filtering
      CREATE INDEX IF NOT EXISTS "reported_jobs_status_idx" ON "reported_jobs" ("status");
    `);
    
    console.log('Reported jobs table created or already exists.');
    return true;
  } catch (error) {
    console.error('Error creating reported_jobs table:', error);
    return false;
  } finally {
    await pool.end();
  }
}

createReportedJobsTable();