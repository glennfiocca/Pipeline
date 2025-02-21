
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
  app.post("/api/admin/users", async (req, res) => {
    try {
      const hashedPassword = await hashPassword(req.body.password);
      const [newUser] = await db.insert(users).values({
        ...req.body,
        password: hashedPassword,
        bankedCredits: 5,
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      }).returning();
      res.json(newUser);
    } catch (error) {
      console.error('User creation error:', error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.post("/api/admin/jobs", async (req, res) => {
    try {
      const jobData = {
        ...req.body,
        jobIdentifier: `PL${String(Date.now()).slice(-6)}`,
        lastCheckedAt: new Date().toISOString()
      };
      const [newJob] = await db.insert(jobs).values(jobData).returning();
      res.json(newJob);
    } catch (error) {
      console.error('Job creation error:', error);
      res.status(500).json({ error: "Failed to create job" });
    }
  });

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

  // Admin CRUD endpoints
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      await db.delete(users).where(eq(users.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const [updatedUser] = await db.update(users)
        .set(req.body)
        .where(eq(users.id, parseInt(req.params.id)))
        .returning();
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/jobs/:id", async (req, res) => {
    try {
      await db.delete(jobs).where(eq(jobs.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  app.patch("/api/admin/jobs/:id", async (req, res) => {
    try {
      const [updatedJob] = await db.update(jobs)
        .set(req.body)
        .where(eq(jobs.id, parseInt(req.params.id)))
        .returning();
      res.json(updatedJob);
    } catch (error) {
      res.status(500).json({ error: "Failed to update job" });
    }
  });

  // Basic health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy" });
  });

  return server;
}
