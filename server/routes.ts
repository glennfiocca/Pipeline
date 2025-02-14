import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertApplicationSchema, insertProfileSchema, insertMessageSchema } from "@shared/schema";
import { ScraperManager } from './services/scraper/manager';
import { db } from './db';
import { users } from '@shared/schema';

// Enhanced admin middleware with specific user check
const isAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Check admin status
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Unauthorized. Admin access required." });
  }

  next();
};

export function registerRoutes(app: Express): Server {
  // Jobs
  app.get("/api/jobs", async (_req, res) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }
    const job = await storage.getJob(jobId);
    if (!job) return res.sendStatus(404);
    res.json(job);
  });

  // Admin routes
  app.get("/api/admin/applications", isAdmin, async (_req, res) => {
    try {
      const applications = await storage.getApplications();
      res.json(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.get("/api/admin/profiles", isAdmin, async (_req, res) => {
    try {
      const profiles = await storage.getProfiles();
      res.json(profiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.patch("/api/admin/applications/:id", isAdmin, async (req, res) => {
    try {
      const { status, notes, nextStep, nextStepDueDate } = req.body;
      const applicationId = parseInt(req.params.id);

      if (isNaN(applicationId)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      const updatedApplication = await storage.updateApplication(applicationId, {
        status,
        notes,
        nextStep,
        nextStepDueDate
      });

      res.json(updatedApplication);
    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  app.get("/api/admin/users", isAdmin, async (_req, res) => {
    try {
      const usersList = await db.select().from(users);
      res.json(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });


  // Admin route for updating users
  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update the user using the storage interface
      const updatedUser = await storage.updateUser(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Admin routes for database management
  app.patch("/api/admin/jobs/:id", isAdmin, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ error: "Invalid job ID" });
      }

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Update the job using the storage interface
      const updatedJob = await storage.updateJob(jobId, req.body);
      res.json(updatedJob);
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ error: "Failed to update job" });
    }
  });

  app.delete("/api/admin/jobs/:id", isAdmin, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ error: "Invalid job ID" });
      }

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Instead of actually deleting, we'll mark it as inactive
      await storage.deactivateJob(jobId);
      res.json({ message: "Job deactivated successfully" });
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  // Regular routes continue...
  app.post("/api/jobs/scrape", async (_req, res) => {
    try {
      console.log('Starting job scraping process...');
      const manager = new ScraperManager();
      const jobs = await manager.runScrapers();
      console.log('Scraping completed, found jobs:', jobs?.length || 0);
      res.json({
        message: "Job scraping completed successfully",
        jobCount: jobs?.length || 0,
        jobs: jobs
      });
    } catch (error) {
      console.error('Error running scrapers:', error);
      res.status(500).json({ error: "Failed to scrape jobs", details: (error as Error).message });
    }
  });

  // Profiles
  app.get("/api/profiles", async (_req, res) => {
    const profiles = await storage.getProfiles();
    res.json(profiles);
  });

  app.get("/api/profiles/:id", async (req, res) => {
    const profile = await storage.getProfile(parseInt(req.params.id));
    if (!profile) return res.sendStatus(404);
    res.json(profile);
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const parsed = insertProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        console.error('Profile validation error:', parsed.error);
        return res.status(400).json(parsed.error);
      }
      const profile = await storage.createProfile(parsed.data);
      res.status(201).json(profile);
    } catch (error) {
      console.error('Profile creation error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/profiles/:id", async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      if (isNaN(profileId)) {
        return res.status(400).json({ error: "Invalid profile ID" });
      }

      const parsed = insertProfileSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        console.error('Profile update validation error:', parsed.error);
        return res.status(400).json(parsed.error);
      }

      const profile = await storage.updateProfile(profileId, parsed.data);
      res.json(profile);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });


  // Applications
  app.get("/api/applications", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const applications = await storage.getApplications();
      // Filter applications for regular users to only see their own
      const userApplications = req.user.isAdmin
        ? applications
        : applications.filter((app: any) => app.profileId === req.user.id);
      res.json(userApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const parsed = insertApplicationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const application = await storage.createApplication({
        ...parsed.data,
        status: "Applied"
      });
      res.status(201).json(application);
    } catch (error) {
      console.error('Application creation error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/applications/:id/status", async (req, res) => {
    try {
      const { status } = req.body;

      if (!status || !["Applied", "Screening", "Interviewing", "Offered", "Accepted", "Rejected", "Withdrawn"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const application = await storage.updateApplicationStatus(parseInt(req.params.id), status);
      res.json(application);
    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Messages routes
  app.get("/api/applications/:id/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const applicationId = parseInt(req.params.id);
      if (isNaN(applicationId)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      const messages = await storage.getMessages(applicationId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/applications/:id/messages", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const applicationId = parseInt(req.params.id);
      if (isNaN(applicationId)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      // Include the sender's username with the message
      const parsed = insertMessageSchema.safeParse({
        ...req.body,
        applicationId,
        isFromAdmin: req.user?.isAdmin || false,
        senderUsername: req.user?.username
      });

      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const message = await storage.createMessage(parsed.data);
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      const message = await storage.markMessageAsRead(messageId);
      res.json(message);
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}