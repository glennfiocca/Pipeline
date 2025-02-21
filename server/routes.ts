
import express from "express";
import { Server } from "http";
import { db } from "./db";
import { jobs, users, applications, feedback, notifications, referrals } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./utils/password";

export function registerRoutes(app: express.Express): Server {
  const server = new Server(app);

  // User routes
  app.post("/api/users", async (req, res) => {
    const { username, email, password, referredBy } = req.body;
    const hashedPassword = await hashPassword(password);
    
    try {
      // Create new user
      const [newUser] = await db.insert(users).values({
        username,
        email,
        password: hashedPassword,
        isAdmin: false,
        bankedCredits: 5, // Initial credits
        referredBy
      }).returning();

      // If referred, award credits to referrer
      if (referredBy) {
        await db.update(users)
          .set({ 
            bankedCredits: sql`banked_credits + 5` 
          })
          .where(eq(users.username, referredBy));
      }
      
      res.json(newUser);
    } catch (error) {
      console.error('User creation error:', error);
      res.status(400).json({ error: "User creation failed" });
    }
  });

  // Basic health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy" });
  });

  return server;
}
