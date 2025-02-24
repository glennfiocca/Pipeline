import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { db } from '../db';
import { users, insertUserSchema } from '@shared/schema';

// Hash password function
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Register handler
export async function registerHandler(req: Request, res: Response) {
  try {
    const validatedData = insertUserSchema.parse(req.body);

    // Create the new user
    const [newUser] = await db.insert(users).values({
      ...validatedData,
      password: await hashPassword(validatedData.password)
    }).returning();

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