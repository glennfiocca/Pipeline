const { Pool } = require('pg');

// Make sure to update with your actual database connection string
// For this example, we're expecting it to be in an environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createReferralCodesTable() {
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
  } finally {
    await pool.end();
  }
}

createReferralCodesTable(); 