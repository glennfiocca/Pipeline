import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertProfileSchema, insertApplicationSchema } from "@shared/schema";
import { ScraperManager } from './services/scraper/manager';

export function registerRoutes(app: Express): Server {
  // Jobs
  app.get("/api/jobs", async (_req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.get("/api/jobs/:id", async (req, res) => {
    const job = await storage.getJob(parseInt(req.params.id));
    if (!job) return res.sendStatus(404);
    res.json(job);
  });

  app.post("/api/jobs", async (req, res) => {
    const parsed = insertJobSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const job = await storage.createJob(parsed.data);
    res.status(201).json(job);
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
      if (!parsed.success) return res.status(400).json(parsed.error);

      // If profile has an ID, update instead of create
      if (req.body.id) {
        const profile = await storage.updateProfile(req.body.id, parsed.data);
        return res.json(profile);
      }

      const profile = await storage.createProfile(parsed.data);
      res.status(201).json(profile);
    } catch (error) {
      console.error('Profile creation/update error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Applications
  app.get("/api/applications", async (_req, res) => {
    const applications = await storage.getApplications();
    res.json(applications);
  });

  app.post("/api/applications", async (req, res) => {
    const parsed = insertApplicationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const application = await storage.createApplication(parsed.data);
    res.status(201).json(application);
  });

  app.patch("/api/applications/:id/status", async (req, res) => {
    const { status } = req.body;
    if (typeof status !== "string") {
      return res.status(400).json({ error: "Status must be a string" });
    }

    try {
      const application = await storage.updateApplicationStatus(
        parseInt(req.params.id),
        status
      );
      res.json(application);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  // Add scraper route
  app.post("/api/jobs/scrape", async (_req, res) => {
    try {
      console.log('Starting job scraping process...');
      const manager = new ScraperManager();
      await manager.runScrapers();

      // Verify jobs were created by counting them
      const jobs = await storage.getJobs();
      console.log(`After scraping, found ${jobs.length} total jobs in database`);

      res.json({ message: "Job scraping completed", jobCount: jobs.length });
    } catch (error) {
      console.error('Error running scrapers:', error);
      res.status(500).json({ error: "Failed to scrape jobs", details: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}