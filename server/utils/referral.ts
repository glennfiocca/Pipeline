import { customAlphabet } from 'nanoid';

// Generate a referral code using uppercase letters and numbers
export function generateReferralCode(): string {
  const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
  return nanoid();
}
