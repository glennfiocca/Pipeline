import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertApplicationSchema } from "@shared/schema";
import { ScraperManager } from './services/scraper/manager';

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

  // Applications
  app.get("/api/applications", async (_req, res) => {
    const applications = await storage.getApplications();
    res.json(applications);
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const parsed = insertApplicationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const application = await storage.createApplication(parsed.data);
      res.status(201).json(application);
    } catch (error) {
      console.error('Application creation error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/applications/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ["Applied", "Screening", "Interviewing", "Offered", "Accepted", "Rejected", "Withdrawn"];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const application = await storage.updateApplicationStatus(parseInt(req.params.id), status);
      res.json(application);
    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}