-- Create the referral_codes table to track user referrals
CREATE TABLE IF NOT EXISTS "referral_codes" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code" TEXT NOT NULL UNIQUE,
  "created_at" TEXT NOT NULL DEFAULT NOW(),
  "usage_count" INTEGER NOT NULL DEFAULT 0
);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS "referral_codes_user_id_idx" ON "referral_codes" ("user_id");

-- Create an index on code for faster lookups
CREATE INDEX IF NOT EXISTS "referral_codes_code_idx" ON "referral_codes" ("code"); 