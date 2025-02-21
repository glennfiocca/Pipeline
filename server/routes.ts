
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

  // Admin routes
  app.get("/api/admin/users", async (_req, res) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/jobs", async (_req, res) => {
    try {
      const allJobs = await db.select().from(jobs);
      res.json(allJobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/admin/feedback", async (_req, res) => {
    try {
      const allFeedback = await db.select().from(feedback);
      res.json(allFeedback);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  app.get("/api/admin/applications", async (_req, res) => {
    try {
      const allApplications = await db.select().from(applications);
      res.json(allApplications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  // Basic health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy" });
  });

  return server;
}
