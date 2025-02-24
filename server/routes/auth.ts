import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { db } from '../db';
import { users, insertUserSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Generate a unique referral code
function generateReferralCode(): string {
  return `PL${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// Hash password function
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Register handler
export async function registerHandler(req: Request, res: Response) {
  try {
    const validatedData = insertUserSchema.parse(req.body);

    // Generate a unique referral code for the new user
    const referralCode = generateReferralCode();

    // Create the new user with default credits and referral code
    const [newUser] = await db.insert(users).values({
      ...validatedData,
      referralCode,
      bankedCredits: 5, // Default credits for new users
      password: await hashPassword(validatedData.password)
    }).returning();

    // If user was referred, add bonus credits to referrer
    if (validatedData.referredBy) {
      const referrer = await db.query.users.findFirst({
        where: eq(users.referralCode, validatedData.referredBy)
      });

      if (referrer) {
        await db.update(users)
          .set({ 
            bankedCredits: referrer.bankedCredits + 5 // Bonus credits for successful referral
          })
          .where(eq(users.id, referrer.id));
      }
    }

    // Clean user data before sending response
    const { password, ...userWithoutPassword } = newUser;
    res.json(userWithoutPassword);
  } catch (error: unknown) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Failed to register user'
    });
  }
}