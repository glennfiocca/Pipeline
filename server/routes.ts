import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertProfileSchema, insertApplicationSchema } from "@shared/schema";
import { ScraperManager } from './services/scraper/manager';
import { processJobPosting, processBatchJobPostings } from './services/job-processor';

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

  // Add new endpoint to test job processing
  app.post("/api/jobs/process", async (req, res) => {
    try {
      const { jobDescription } = req.body;
      if (!jobDescription || typeof jobDescription !== "string") {
        return res.status(400).json({ error: "Job description is required" });
      }

      const processedJob = await processJobPosting(jobDescription);
      res.json(processedJob);
    } catch (error) {
      console.error('Error processing job:', error);
      res.status(500).json({ error: "Failed to process job description", details: (error as Error).message });
    }
  });

  // Update the scraper endpoint to use our new processor
  app.post("/api/jobs/scrape", async (_req, res) => {
    try {
      console.log('Starting job scraping process...');
      const manager = new ScraperManager();
      const rawJobData = await manager.runScrapers();

      // Process the raw job data using our new processor
      console.log('Processing scraped jobs...');
      const processedJobs = await processBatchJobPostings(rawJobData);

      // Store the processed jobs
      for (const job of processedJobs) {
        await storage.createJob({
          ...job,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      // Verify jobs were created by counting them
      const jobs = await storage.getJobs();
      console.log(`After processing, found ${jobs.length} total jobs in database`);

      res.json({ 
        message: "Job scraping and processing completed", 
        jobCount: jobs.length,
        processedCount: processedJobs.length 
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

  // Handle both POST (create) and PATCH (update) for profiles
  app.post("/api/profiles", async (req, res) => {
    try {
      const parsed = insertProfileSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);
      const profile = await storage.createProfile(parsed.data);
      res.status(201).json(profile);
    } catch (error) {
      console.error('Profile creation error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Add specific PATCH route for profile updates
  app.patch("/api/profiles/:id", async (req, res) => {
    try {
      console.log('Received PATCH request for profile:', req.params.id);
      console.log('Request body:', req.body);

      const parsed = insertProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        console.error('Validation error:', parsed.error);
        return res.status(400).json(parsed.error);
      }

      const profile = await storage.updateProfile(parseInt(req.params.id), parsed.data);
      console.log('Updated profile:', profile);
      res.json(profile);
    } catch (error) {
      console.error('Profile update error:', error);
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

  const httpServer = createServer(app);
  return httpServer;
}