import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertApplicationSchema, insertProfileSchema, insertMessageSchema, insertUserSchema, insertFeedbackSchema } from "@shared/schema";
import { ScraperManager } from './services/scraper/manager';
import { db } from './db';
import { users } from '@shared/schema';
import { hashPassword } from './utils/password'; // Assuming this function exists
import { eq } from 'drizzle-orm';

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
  // Add POST endpoint for job creation
  app.post("/api/jobs", async (req: any, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check admin status
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: "Unauthorized. Admin access required." });
      }

      const parsed = insertJobSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid job data", 
          details: parsed.error.format() 
        });
      }

      const job = await storage.createJob(parsed.data);
      res.status(201).json(job);
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({ 
        error: "Failed to create job",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

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

      // Get the job details for the notification
      const job = await storage.getJob(application.jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Store the current state of the application to detect changes
      const oldStatus = application.status;
      const oldNextStep = application.nextStep;

      // Update the application
      const updatedApplication = await storage.updateApplication(applicationId, {
        status,
        notes,
        nextStep,
        nextStepDueDate
      });

      // Create notifications for material changes
      if (application.profileId) {
        // 1. Status change notification
        if (status && status !== oldStatus) {
          // Determine notification type and content based on status
          const notificationData = 
            status === 'Accepted' 
              ? {
                  type: 'application_accepted' as const,
                  title: 'Application Accepted',
                  content: `Congratulations! Your application for ${job.title} at ${job.company} has been accepted.`
                }
              : status === 'Rejected'
                ? {
                    type: 'application_rejected' as const,
                    title: 'Application Not Selected',
                    content: `We regret to inform you that your application for ${job.title} at ${job.company} was not selected to move forward.`
                  }
                : {
                    type: 'application_status' as const,
                    title: 'Application Status Updated',
                    content: `Your application for ${job.title} at ${job.company} has been moved to ${status}`
                  };
          
          await storage.createNotification({
            userId: application.profileId,
            ...notificationData,
            isRead: false,
            relatedId: applicationId,
            relatedType: 'application',
            metadata: {
              applicationId,
              oldStatus,
              newStatus: status,
              jobId: job.id,
              jobTitle: job.title,
              company: job.company
            }
          });
        }

        // 2. Next Steps notification - if next steps were added or updated
        if (nextStep && nextStep !== oldNextStep) {
          const isNewSteps = !oldNextStep; // Check if this is the first time next steps are being added
          
          await storage.createNotification({
            userId: application.profileId,
            type: isNewSteps ? 'next_steps_added' as const : 'next_steps_updated' as const,
            title: isNewSteps ? 'Next Steps Added' : 'Next Steps Updated',
            content: `Next steps have been ${isNewSteps ? 'added to' : 'updated for'} your application for ${job.title} at ${job.company}.`,
            isRead: false,
            relatedId: applicationId,
            relatedType: 'application',
            metadata: {
              applicationId,
              nextSteps: nextStep.split('\n').filter((step: string) => step.trim()),
              jobId: job.id,
              jobTitle: job.title,
              company: job.company
            }
          });
        }
      }

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

  app.get("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Example of using Drizzle-ORM:
      const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (!userRecord.length) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(userRecord[0]);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
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

      // Permanently delete the job
      await storage.deleteJob(jobId);
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  // Add delete route for users
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't allow deleting the last admin
      const admins = await storage.getAdminUsers();
      if (user.isAdmin && admins.length <= 1) {
        return res.status(400).json({ error: "Cannot delete the last administrator" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Add POST endpoint for admin user creation
  app.post("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid user data", 
          details: parsed.error 
        });
      }

      const existingUser = await storage.getUserByUsername(parsed.data.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash the password before storing
      const hashedPassword = await hashPassword(parsed.data.password);

      const user = await storage.createUser({
        ...parsed.data,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      });

      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ 
        error: "Failed to create user",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin routes continue...
  app.patch("/api/admin/users/:id/credits", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const { amount } = req.body;
      if (typeof amount !== 'number') {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Add the banked credits using the storage interface
      const updatedUser = await storage.addBankedCredits(userId, amount);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user credits:', error);
      res.status(500).json({ error: "Failed to update user credits" });
    }
  });

  // Add this endpoint near other user-related routes
  app.get("/api/users/:id", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Users can only access their own data
      if (req.user.id !== parseInt(req.params.id) && !req.user.isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't send sensitive information
      const { password, resetToken, resetTokenExpiry, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Add near other user-related routes
  app.post("/api/users/:id/referral-code", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Users can only generate their own referral code
      if (req.user.id !== parseInt(req.params.id)) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate a new referral code
      const referralCode = await storage.generateReferralCode(user.id);
      res.json({ referralCode });
    } catch (error) {
      console.error('Error generating referral code:', error);
      res.status(500).json({ error: "Failed to generate referral code" });
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

  app.get("/api/profiles/:id", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const profileId = parseInt(req.params.id);
      if (isNaN(profileId)) {
        return res.status(400).json({ error: "Invalid profile ID" });
      }

      // First try to get profile by ID
      let profile = await storage.getProfile(profileId);
      
      // If no profile found, try to get profile by user ID
      if (!profile) {
        profile = await storage.getProfileByUserId(req.user.id);
      }

      // If still no profile, create a new one for the user
      if (!profile) {
        profile = await storage.createProfile({
          userId: req.user.id,
          name: req.user.name || "",
          email: req.user.email || "",
          phone: "",
          title: "",
          bio: "",
          location: "",
          education: [],
          experience: [],
          skills: [],
          certifications: [],
          languages: [],
          publications: [],
          projects: [],
          address: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
          workAuthorization: "US Citizen",
          availability: "2 Weeks",
          citizenshipStatus: ""
        });
      }

      // Ensure users can only access their own profile
      if (profile.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.get("/api/profiles/:userId", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Get profile by user ID
      let profile = await storage.getProfileByUserId(userId);

      // If no profile exists, create one
      if (!profile) {
        profile = await storage.createProfile({
          userId,
          name: req.user.username || "",
          email: req.user.email || "",
          phone: "",
          title: "",
          bio: "",
          location: "",
          education: [],
          experience: [],
          skills: [],
          certifications: [],
          languages: [],
          address: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
          workAuthorization: "US Citizen",
          availability: "2 Weeks",
          citizenshipStatus: ""
        });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profiles", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      console.log("Received profile data:", req.body);

      // 1) Validate incoming data with insertProfileSchema
      const safeParse = insertProfileSchema.safeParse({
        ...req.body,
        userId: req.user.id // Force userId from session
      });

      // 2) Handle invalid data
      if (!safeParse.success) {
        console.error("Validation error:", safeParse.error.format());
        return res.status(400).json({
          error: "Invalid profile data",
          details: safeParse.error.format()
        });
      }

      // 3) Use the validated data for DB operations
      const profileData = safeParse.data;

      // Check if profile already exists
      let existingProfile = await storage.getProfileByUserId(req.user.id);
      let profile;

      try {
        if (existingProfile) {
          // Update existing profile
          profile = await storage.updateProfile(existingProfile.id, profileData);
          console.log("Updated profile:", profile);
        } else {
          // Create new profile
          profile = await storage.createProfile(profileData);
          console.log("Created new profile:", profile);
        }

        if (!profile) {
          throw new Error("Failed to save profile");
        }

        // Fetch the complete profile to return
        const savedProfile = await storage.getProfileByUserId(req.user.id);
        if (!savedProfile) {
          throw new Error("Failed to fetch saved profile");
        }

        res.json(savedProfile);
      } catch (error) {
        console.error("Database operation failed:", error);
        throw error; // Re-throw to be caught by outer try-catch
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      res.status(500).json({
        error: "Failed to save profile",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.patch("/api/profiles/:id", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const profileId = parseInt(req.params.id);
      if (isNaN(profileId)) {
        return res.status(400).json({ error: "Invalid profile ID" });
      }

      // Get existing profile
      const existingProfile = await storage.getProfile(profileId);
      if (!existingProfile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Check ownership
      if (existingProfile.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const parsed = insertProfileSchema.partial().safeParse({
        ...req.body,
        userId: existingProfile.userId // Preserve the original userId
      });

      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid profile data", 
          details: parsed.error.format() 
        });
      }

      const updatedProfile = await storage.updateProfile(profileId, parsed.data);
      res.json(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ 
        error: "Failed to update profile",
        message: error instanceof Error ? error.message : "Unknown error"
      });
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

      const applicationId = parseInt(req.params.id);
      if (isNaN(applicationId)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      // Get the application to fetch user and job details
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Get the job details
      const job = await storage.getJob(application.jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Update application status
      const updatedApplication = await storage.updateApplicationStatus(applicationId, status);

      // Create a notification for the status change
      if (application.profileId) {
        // Determine notification type and content based on status
        const notificationData = 
          status === 'Accepted' 
            ? {
                type: 'application_accepted' as const,
                title: 'Application Accepted',
                content: `Congratulations! Your application for ${job.title} at ${job.company} has been accepted.`
              }
            : status === 'Rejected'
              ? {
                  type: 'application_rejected' as const,
                  title: 'Application Not Selected',
                  content: `We regret to inform you that your application for ${job.title} at ${job.company} was not selected to move forward.`
                }
              : {
                  type: 'application_status' as const,
                  title: 'Application Status Updated',
                  content: `Your application for ${job.title} at ${job.company} has been moved to ${status}`
                };
        
        await storage.createNotification({
          userId: application.profileId,
          ...notificationData,
          isRead: false,
          relatedId: applicationId,
          relatedType: 'application',
          metadata: {
            jobId: job.id,
            applicationId: applicationId,
            oldStatus: application.status,
            newStatus: status,
            company: job.company,
            jobTitle: job.title
          }
        });
      }

      res.json(updatedApplication);
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

      // Get the application first
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Get the job details
      const job = await storage.getJob(application.jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Prepare message data - only include required fields
      const messageData = {
        applicationId,
        content: req.body.content,
        isFromAdmin: req.user?.isAdmin || false,
        senderUsername: req.user?.isAdmin ? job.company : req.user?.username,
        isRead: false
      };

      // Create the message first
      const message = await storage.createMessage(messageData);

      // Create notification for the recipient if message is from admin
      if (req.user?.isAdmin) {
        try {
          await storage.createNotification({
            userId: application.profileId,
            type: 'message_received' as const,
            title: 'New Message from Company',
            content: `You have a new message regarding your application for ${job.title}`,
            isRead: false,
            relatedId: applicationId,
            relatedType: 'application',
            metadata: {
              applicationId,
              messageId: message.id,
              jobTitle: job.title,
              company: job.company
            }
          });
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
          // Continue even if notification fails
        }
      }

      // Return the created message
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      // Log the actual error details
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      res.status(500).json({ 
        error: "Failed to create message",
        details: error instanceof Error ? error.message : "Unknown error"
      });
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

  // Feedback routes
  app.post("/api/feedback", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const parsed = insertFeedbackSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid feedback data", 
          details: parsed.error 
        });
      }

      const feedback = await storage.createFeedback({
        ...parsed.data,
        userId: req.user?.id,
        status: "received"
      });

      res.status(201).json(feedback);
    } catch (error) {
      console.error('Error creating feedback:', error);
      res.status(500).json({ 
        error: "Failed to create feedback",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin feedback routes
  app.get("/api/feedback", isAdmin, async (_req, res) => {
    try {
      const feedbackList = await storage.getFeedback();
      res.json(feedbackList);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  app.patch("/api/admin/feedback/:id", isAdmin, async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.id);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }

      const feedback = await storage.getFeedbackById(feedbackId);
      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      const updatedFeedback = await storage.updateFeedback(feedbackId, req.body);
      res.json(updatedFeedback);
    } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({ error: "Failed to update feedback" });
    }
  });

  // Update the delete route for feedback
  app.delete("/api/admin/feedback/:id", isAdmin, async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.id);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }

      const feedback = await storage.getFeedbackById(feedbackId);
      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      // Permanently delete the feedback
      await storage.deleteFeedback(feedbackId);
      
      // Log the deletion for debugging
      console.log(`Feedback ID ${feedbackId} deleted successfully`);
      
      res.json({ message: "Feedback deleted successfully" });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      res.status(500).json({ error: "Failed to delete feedback" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const notifications = await storage.getNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const count = await storage.getUnreadNotificationCount(req.user.id);
      res.json(count);
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      res.status(500).json({ error: "Failed to get unread notification count" });
    }
  });

  app.post("/api/notifications", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Only admin users or users creating notifications for themselves can use this endpoint
      if (!req.user?.isAdmin && req.body.userId !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized to create notifications for this user" });
      }

      // Map the legacy format to the new schema format
      let notificationData = { ...req.body };
      
      // Convert message field to content if it exists and content doesn't
      if (req.body.message && !req.body.content) {
        notificationData.content = req.body.message;
        delete notificationData.message;
      }

      // Convert read field to isRead if it exists and isRead doesn't
      if (req.body.read !== undefined && req.body.isRead === undefined) {
        notificationData.isRead = req.body.read;
        delete notificationData.read;
      }

      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      if (error instanceof Error) {
        res.status(500).json({ error: "Failed to create notification", details: error.message });
      } else {
        res.status(500).json({ error: "Failed to create notification" });
      }
    }
  });

  app.post("/api/notifications/:id/mark-read", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }

      const notification = await storage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        console.log('Unauthenticated delete attempt');
        return res.status(401).json({ error: "Authentication required" });
      }

      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        console.log('Invalid notification ID format:', req.params.id);
        return res.status(400).json({ error: "Invalid notification ID" });
      }

      console.log(`Processing delete request for notification ID: ${notificationId} by user ID: ${req.user.id}`);

      // Get the notification to verify ownership
      const notification = await storage.getNotificationById(notificationId);
      
      if (!notification) {
        console.log(`Notification not found: ${notificationId}`);
        return res.status(404).json({ error: "Notification not found" });
      }

      // Only allow users to delete their own notifications
      if (notification.userId !== req.user.id && !req.user.isAdmin) {
        console.log(`Unauthorized delete attempt - User ${req.user.id} tried to delete notification ${notificationId} owned by user ${notification.userId}`);
        return res.status(403).json({ error: "Unauthorized to delete this notification" });
      }

      // Force a hard delete from the database
      const deleted = await storage.deleteNotification(notificationId);
      
      if (!deleted) {
        console.log(`Failed to delete notification: ${notificationId}`);
        return res.status(500).json({ error: "Failed to delete notification" });
      }
      
      // Clear any cached notifications for this user
      // This ensures the notification won't be retrieved again
      console.log(`Successfully deleted notification: ${notificationId}`);
      res.json({ 
        success: true,
        message: "Notification deleted successfully", 
        id: notificationId 
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid user data" });
      }

      const { username, email, password, referredBy } = parsed.data;

      // Check if username exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create new user with default 5 credits
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        referredBy,
        bankedCredits: 5 // Default credits for new users
      });

      // If user was referred, add bonus credits to referrer
      if (referredBy) {
        const referrer = await storage.getUserByUsername(referredBy);
        if (referrer) {
          await storage.addBankedCredits(referrer.id, 5);
        }
      }

      // Generate referral code for new user
      await storage.generateReferralCode(user.id);

      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Add this endpoint with other admin routes
  app.get("/api/admin/profiles/:userId", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const profile = await storage.getProfileByUserId(userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}