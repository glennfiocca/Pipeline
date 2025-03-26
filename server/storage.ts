import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc, and, ilike } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { 
  messages, applications, jobs, profiles, users, feedback, notifications, referralCodes, savedJobs, reportedJobs,
  type Message, type InsertMessage,
  type Job, type Profile, type Application, type User,
  type InsertJob, type InsertProfile, type InsertApplication, type InsertUser,
  type Feedback, type InsertFeedback,
  type Notification, type InsertNotification,
  type ReferralCode, type InsertReferralCode,
  type SavedJob, type InsertSavedJob,
  type ReportedJob, type InsertReportedJob
} from "@shared/schema";
import { db } from "./db";
import { nanoid } from 'nanoid';
import { createReferralCodesTable } from './db';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  getActiveJobs(): Promise<Job[]>;

  // Profiles
  getProfiles(): Promise<Profile[]>;
  getProfile(id: number): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile>;
  getProfileByUserId(userId: number): Promise<Profile | undefined>;

  // Applications
  getApplications(): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: string): Promise<Application>;
  updateApplication(
    id: number,
    updates: {
      status?: string;
      notes?: string;
      nextStep?: string;
      nextStepDueDate?: string;
    }
  ): Promise<Application>;

  // User-related interfaces
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: Pick<InsertUser, "username" | "email" | "password"> & { createdAt: string, bankedCredits: number, lastCreditReset: string }): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User>;
  updateUserResetToken(id: number, token: string, expiry: string): Promise<User>;
  clearUserResetToken(id: number): Promise<User>;
  addBankedCredits(userId: number, amount: number): Promise<User>;

  // Session store
  sessionStore: session.Store;

  // Messages
  getMessages(applicationId: number): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message>;
  getUnreadMessageCount(applicationId: number): Promise<number>;

  // Job management
  updateJob(id: number, updates: Partial<InsertJob>): Promise<Job>;
  deactivateJob(id: number): Promise<Job>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAdminUsers(): Promise<User[]>;
  deleteJob(id: number): Promise<void>;

  // Feedback methods
  getFeedback(): Promise<Feedback[]>;
  getFeedbackById(id: number): Promise<Feedback | undefined>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedbackStatus(id: number, status: string, adminResponse?: string): Promise<Feedback>;
  getUnresolvedFeedback(): Promise<Feedback[]>;
  updateFeedback(id: number, updates: Partial<Feedback>): Promise<Feedback>;
  deleteFeedback(id: number): Promise<void>;

  // Notification methods
  getNotifications(userId: number): Promise<Notification[]>;
  getNotificationById(id: number): Promise<Notification | undefined>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<boolean>;

  // Referral code methods
  getReferralCode(userId: number): Promise<string | null>;
  generateReferralCode(userId: number): Promise<string>;
  getReferralByCode(code: string): Promise<ReferralCode | null>;
  incrementReferralUsage(referralId: number): Promise<ReferralCode>;

  // New method
  getApplicationUnreadMessageCount(applicationId: number, forAdmin: boolean): Promise<number>;

  // New method
  getApplicationMessages(applicationId: number): Promise<Message[]>;
  createApplicationMessage(message: InsertMessage): Promise<Message>;

  // Credit management
  getDailyCredits(userId: number): Promise<number>;
  resetDailyCreditsIfNeeded(userId: number): Promise<User>;
  
  // Saved jobs methods
  getSavedJobs(userId: number): Promise<SavedJob[]>;
  getSavedJobsWithDetails(userId: number): Promise<(SavedJob & { job: Job })[]>;
  saveJob(savedJob: InsertSavedJob): Promise<SavedJob>;
  unsaveJob(userId: number, jobId: number): Promise<void>;
  isJobSaved(userId: number, jobId: number): Promise<boolean>;
  
  // Reported jobs methods
  getReportedJobs(): Promise<ReportedJob[]>;
  getReportedJobById(id: number): Promise<ReportedJob | undefined>;
  getReportedJobsByUser(userId: number): Promise<ReportedJob[]>;
  getReportedJobsByStatus(status: string): Promise<ReportedJob[]>;
  getReportedJobsWithDetails(): Promise<(ReportedJob & { job: Job; user: User })[]>;
  reportJob(report: InsertReportedJob): Promise<ReportedJob>;
  updateReportStatus(id: number, status: string, adminNotes?: string, reviewedBy?: number): Promise<ReportedJob>;
  deleteJobReport(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const sessionConfig = {
      pool: db.$client,
      tableName: 'session',
      createTableIfMissing: true,
      pruneSessionInterval: 60, // Prune invalid sessions every minute
      // Error handler for session store
      errorLog: (error: Error) => {
        console.error('Session store error:', error);
      }
    };

    this.sessionStore = new PostgresSessionStore(sessionConfig);

    // Add error handler for the session store
    this.sessionStore.on('error', (error) => {
      console.error('Session store error:', error);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(ilike(users.username, username));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async createUser(insertUser: Pick<InsertUser, "username" | "email" | "password"> & { createdAt: string, bankedCredits: number, lastCreditReset: string }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserResetToken(id: number, token: string, expiry: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ resetToken: token, resetTokenExpiry: expiry })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async clearUserResetToken(id: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ resetToken: null, resetTokenExpiry: null })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getActiveJobs(): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.isActive, true));
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  private async generateUniqueJobIdentifier(): Promise<string> {
    let isUnique = false;
    let jobIdentifier = '';

    while (!isUnique) {
      const randomNum = Math.floor(Math.random() * 900000) + 100000;
      jobIdentifier = `PL${randomNum}`;

      const [existingJob] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.jobIdentifier, jobIdentifier));

      if (!existingJob) {
        isUnique = true;
      }
    }

    return jobIdentifier;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const jobIdentifier = await this.generateUniqueJobIdentifier();
    const [job] = await db.insert(jobs).values({
      ...insertJob,
      jobIdentifier,
      lastCheckedAt: new Date().toISOString(),
      published: true,
      isActive: true
    }).returning();
    return job;
  }

  async getProfiles(): Promise<Profile[]> {
    return await db.select().from(profiles);
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.email, email));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    try {
      console.log("Creating profile with data:", JSON.stringify(profile));

      // Ensure all array fields are properly initialized
      const dataToCreate = {
        ...profile,
        education: Array.isArray(profile.education) ? profile.education : [],
        experience: Array.isArray(profile.experience) ? profile.experience : [],
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
        languages: Array.isArray(profile.languages) ? profile.languages : [],
        publications: Array.isArray(profile.publications) ? profile.publications : [],
        projects: Array.isArray(profile.projects) ? profile.projects : [],
        preferredLocations: Array.isArray(profile.preferredLocations) ? profile.preferredLocations : [],
        referenceList: Array.isArray(profile.referenceList) ? profile.referenceList : [],
      };

      const [newProfile] = await db
        .insert(profiles)
        .values({
          ...dataToCreate,
          skills: dataToCreate.skills || [],
          preferredLocations: dataToCreate.preferredLocations || [],
          referenceList: dataToCreate.referenceList || []
        } as any) // Type assertion needed due to complex schema
        .returning();

      console.log("Created profile:", newProfile);
      return newProfile;
    } catch (error) {
      console.error("Error in createProfile:", error);
      throw error;
    }
  }

  async updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile> {
    try {
      console.log(`Updating profile with ID ${id} with data:`, JSON.stringify(profile));

      // Get existing profile first
      const [existingProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, id));

      if (!existingProfile) {
        throw new Error(`Profile not found with ID: ${id}`);
      }

      // Create an object with the fields to update, preserving existing values if not provided
      const updateData = {
        ...profile,
        education: Array.isArray(profile.education) ? profile.education : existingProfile.education,
        experience: Array.isArray(profile.experience) ? profile.experience : existingProfile.experience,
        skills: Array.isArray(profile.skills) ? profile.skills : existingProfile.skills,
        certifications: Array.isArray(profile.certifications) ? profile.certifications : existingProfile.certifications,
        languages: Array.isArray(profile.languages) ? profile.languages : existingProfile.languages,
        publications: Array.isArray(profile.publications) ? profile.publications : existingProfile.publications,
        projects: Array.isArray(profile.projects) ? profile.projects : existingProfile.projects,
        preferredLocations: Array.isArray(profile.preferredLocations) ? profile.preferredLocations : existingProfile.preferredLocations,
        referenceList: Array.isArray(profile.referenceList) ? profile.referenceList : existingProfile.referenceList,
      };

      const [updatedProfile] = await db
        .update(profiles)
        .set({
          ...updateData,
          skills: updateData.skills || existingProfile.skills || [],
          preferredLocations: updateData.preferredLocations || existingProfile.preferredLocations || [],
          referenceList: updateData.referenceList || existingProfile.referenceList || []
        } as any) // Type assertion needed due to complex schema
        .where(eq(profiles.id, id))
        .returning();

      console.log("Updated profile:", updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error("Error in updateProfile:", error);
      throw error;
    }
  }

  async getApplications(): Promise<Application[]> {
    return await db.select().from(applications);
  }

  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application;
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const now = new Date().toISOString();
    const status = insertApplication.status.charAt(0).toUpperCase() + insertApplication.status.slice(1).toLowerCase();

    const [application] = await db
      .insert(applications)
      .values({
        ...insertApplication,
        status,
        appliedAt: now,
        lastStatusUpdate: now,
        statusHistory: [{
          status,
          date: now
        }]
      })
      .returning();

    return application;
  }

  async updateApplicationStatus(id: number, status: string): Promise<Application> {
    const [currentApp] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));

    if (!currentApp) {
      throw new Error("Application not found");
    }

    const now = new Date().toISOString();
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    const newHistoryEntry = {
      status: normalizedStatus,
      date: now
    };

    const currentHistory = Array.isArray(currentApp.statusHistory) ? currentApp.statusHistory : [];
    const updatedHistory = [...currentHistory, newHistoryEntry];

    const [application] = await db
      .update(applications)
      .set({
        status: normalizedStatus,
        lastStatusUpdate: now,
        statusHistory: updatedHistory
      })
      .where(eq(applications.id, id))
      .returning();

    return application;
  }
  async updateApplication(
    id: number,
    updates: {
      status?: string;
      notes?: string;
      nextStep?: string;
      nextStepDueDate?: string;
    }
  ): Promise<Application> {
    const [currentApp] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));

    if (!currentApp) {
      throw new Error("Application not found");
    }

    const now = new Date().toISOString();
    const updateData: any = { ...updates };

    if (updates.status && updates.status !== currentApp.status) {
      const currentHistory = Array.isArray(currentApp.statusHistory)
        ? currentApp.statusHistory
        : [];

      updateData.statusHistory = [
        ...currentHistory,
        {
          status: updates.status,
          date: now
        }
      ];
      updateData.lastStatusUpdate = now;
    }

    const [application] = await db
      .update(applications)
      .set(updateData)
      .where(eq(applications.id, id))
      .returning();

    return application;
  }

  async getMessages(applicationId: number): Promise<Message[]> {
    try {
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, applicationId));

      if (!application) {
        console.error(`Application not found for ID: ${applicationId}`);
        return [];
      }

      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, application.jobId));

      if (!job) {
        console.error(`Job not found for ID: ${application.jobId}`);
        return [];
      }

      const applicationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.applicationId, applicationId))
        .orderBy(messages.createdAt);

      return applicationMessages.map(message => ({
        ...message,
        senderUsername: message.isFromAdmin ? job.company : message.senderUsername
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    try {
      if (insertMessage.isFromAdmin) {
        const [application] = await db
          .select()
          .from(applications)
          .where(eq(applications.id, insertMessage.applicationId));

        if (!application) {
          throw new Error(`Application not found for ID: ${insertMessage.applicationId}`);
        }

        const [job] = await db
          .select()
          .from(jobs)
          .where(eq(jobs.id, application.jobId));

        if (!job) {
          throw new Error(`Job not found for ID: ${application.jobId}`);
        }
      }

      const [message] = await db
        .insert(messages)
        .values({
          ...insertMessage,
          createdAt: new Date().toISOString()
        })
        .returning();

      return message;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async markMessageAsRead(id: number): Promise<Message> {
    try {
      const [message] = await db
        .update(messages)
        .set({ isRead: true })
        .where(eq(messages.id, id))
        .returning();

      if (!message) {
        throw new Error(`Message not found for ID: ${id}`);
      }

      return message;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async getUnreadMessageCount(applicationId: number): Promise<number> {
    try {
      const unreadMessages = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.applicationId, applicationId),
            eq(messages.isRead, false)
          )
        );
      return unreadMessages.length;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  async deactivateJob(id: number): Promise<Job> {
    const now = new Date().toISOString();
    const [job] = await db
      .update(jobs)
      .set({
        isActive: false,
        deactivatedAt: now
      })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isAdmin, true));
  }
  async deleteJob(id: number): Promise<void> {
    await db.delete(jobs).where(eq(jobs.id, id));
  }

  async getFeedback(): Promise<Feedback[]> {
    return await db
      .select()
      .from(feedback)
      .orderBy(desc(feedback.createdAt));
  }

  async getFeedbackById(id: number): Promise<Feedback | undefined> {
    const [feedbackItem] = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, id));
    return feedbackItem;
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const [result] = await db
      .insert(feedback)
      .values({
        ...insertFeedback,
        createdAt: new Date().toISOString()
      })
      .returning();
    return result;
  }

  async updateFeedbackStatus(
    id: number,
    status: string,
    adminResponse?: string
  ): Promise<Feedback> {
    const [result] = await db
      .update(feedback)
      .set({
        status,
        adminResponse,
        resolved: status === "resolved",
      })
      .where(eq(feedback.id, id))
      .returning();
    return result;
  }

  async updateFeedback(
    id: number,
    updates: Partial<Feedback>
  ): Promise<Feedback> {
    const [result] = await db
      .update(feedback)
      .set(updates)
      .where(eq(feedback.id, id))
      .returning();
    return result;
  }

  async getUnresolvedFeedback(): Promise<Feedback[]> {
    return await db
      .select()
      .from(feedback)
      .where(eq(feedback.resolved, false))
      .orderBy(desc(feedback.createdAt));
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotificationById(id: number): Promise<Notification | undefined> {
    const results = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));

    return results.length > 0 ? results[0] : undefined;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    return unreadNotifications.length;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        ...notification,
        createdAt: new Date().toISOString()
      })
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: number): Promise<boolean> {
    try {
      console.log(`[Storage] Attempting to delete notification with ID: ${id}`);

      // First check if the notification exists
      const notification = await this.getNotificationById(id);
      if (!notification) {
        console.warn(`[Storage] No notification found with ID ${id} to delete`);
        return false;
      }

      // Execute a hard delete without any soft delete functionality
      const result = await db
        .delete(notifications)
        .where(eq(notifications.id, id))
        .returning();

      // Check if the delete operation was successful
      if (result.length === 0) {
        console.warn(`[Storage] Delete operation completed but no notification was deleted for ID ${id}`);
        return false;
      }

      // Verify that the notification is actually gone
      const checkDeleted = await this.getNotificationById(id);
      if (checkDeleted) {
        console.error(`[Storage] Deletion verification failed - notification with ID ${id} still exists`);
        return false;
      }

      console.log(`[Storage] Successfully deleted notification with ID: ${id}`);
      return true;
    } catch (error) {
      console.error(`[Storage] Error deleting notification with ID ${id}:`, error);
      throw error;
    }
  }

  async getProfileByUserId(userId: number): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    return profile;
  }

  async deleteFeedback(id: number): Promise<void> {
    try {
      console.log(`Attempting to delete feedback with ID: ${id}`);
      await db
        .delete(feedback)
        .where(eq(feedback.id, id))
        .execute();

      console.log(`Successfully deleted feedback with ID: ${id}`);
    } catch (error) {
      console.error(`Error deleting feedback with ID: ${id}:`, error);
      throw error;
    }
  }

  async addBankedCredits(userId: number, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newCreditAmount = user.bankedCredits + amount;

    const [updatedUser] = await db
      .update(users)
      .set({ bankedCredits: newCreditAmount })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async getDailyCredits(userId: number): Promise<number> {
    // First check if daily credits need to be reset
    await this.resetDailyCreditsIfNeeded(userId);
    
    // Get the user's current daily credits
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // We store 10 daily credits as the default that resets at midnight
    // This assumes we add a dailyCredits column to the users table
    // For now, we'll return a constant 10 as that's the system requirement
    return 10;
  }
  
  async resetDailyCreditsIfNeeded(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Parse the last reset date
    const lastResetDate = new Date(user.lastCreditReset);
    const now = new Date();
    
    // Check if it's a new day (past midnight) since the last reset
    const isNewDay = 
      lastResetDate.getDate() !== now.getDate() ||
      lastResetDate.getMonth() !== now.getMonth() ||
      lastResetDate.getFullYear() !== now.getFullYear();
      
    if (isNewDay) {
      // It's a new day, reset credits to 10 and update the lastCreditReset timestamp
      const [updatedUser] = await db
        .update(users)
        .set({ lastCreditReset: now.toISOString() })
        .where(eq(users.id, userId))
        .returning();
        
      return updatedUser;
    }
    
    return user;
  }

  async getApplicationUnreadMessageCount(applicationId: number, forAdmin: boolean): Promise<number> {
    try {
      // For admin: Count unread messages FROM user (where isFromAdmin is false)
      // For user: Count unread messages FROM admin (where isFromAdmin is true)
      const unreadMessages = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.applicationId, applicationId),
            eq(messages.isRead, false),
            eq(messages.isFromAdmin, !forAdmin) // Invert based on who's checking
          )
        );
      return unreadMessages.length;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  async getApplicationMessages(applicationId: number): Promise<Message[]> {
    try {
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, applicationId));

      if (!application) {
        console.error(`Application not found for ID: ${applicationId}`);
        return [];
      }

      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, application.jobId));

      if (!job) {
        console.error(`Job not found for ID: ${application.jobId}`);
        return [];
      }

      const applicationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.applicationId, applicationId))
        .orderBy(messages.createdAt);

      return applicationMessages.map(message => ({
        ...message,
        senderUsername: message.isFromAdmin ? job.company : message.senderUsername
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async createApplicationMessage(message: InsertMessage): Promise<Message> {
    try {
      if (message.isFromAdmin) {
        const [application] = await db
          .select()
          .from(applications)
          .where(eq(applications.id, message.applicationId));

        if (!application) {
          throw new Error(`Application not found for ID: ${message.applicationId}`);
        }

        const [job] = await db
          .select()
          .from(jobs)
          .where(eq(jobs.id, application.jobId));

        if (!job) {
          throw new Error(`Job not found for ID: ${application.jobId}`);
        }
      }

      const [createdMessage] = await db
        .insert(messages)
        .values({
          ...message,
          createdAt: new Date().toISOString()
        })
        .returning();

      return createdMessage;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async getReferralCode(userId: number): Promise<string | null> {
    try {
      const [referralCode] = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.userId, userId));
      return referralCode ? referralCode.code : null;
    } catch (error) {
      console.error('Error in getReferralCode:', error);
      // Check if the table exists
      console.log('Checking if referral_codes table exists...');
      return null;
    }
  }

  async getReferralByCode(code: string): Promise<ReferralCode | null> {
    try {
      const [referralCode] = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.code, code));
      return referralCode || null;
    } catch (error) {
      console.error('Error in getReferralByCode:', error);
      return null;
    }
  }

  async incrementReferralUsage(referralId: number): Promise<ReferralCode> {
    try {
      const [referralCode] = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.id, referralId));
      
      if (!referralCode) {
        throw new Error(`Referral code with ID ${referralId} not found`);
      }
      
      const [updatedReferralCode] = await db
        .update(referralCodes)
        .set({ usageCount: referralCode.usageCount + 1 })
        .where(eq(referralCodes.id, referralId))
        .returning();
      
      return updatedReferralCode;
    } catch (error) {
      console.error('Error in incrementReferralUsage:', error);
      throw error;
    }
  }

  async generateReferralCode(userId: number): Promise<string> {
    try {
      let isUnique = false;
      let referralCode = '';

      while (!isUnique) {
        referralCode = nanoid(8);

        const [existingReferralCode] = await db
          .select()
          .from(referralCodes)
          .where(eq(referralCodes.code, referralCode));

        if (!existingReferralCode) {
          isUnique = true;
        }
      }

      await db
        .insert(referralCodes)
        .values({
          userId,
          code: referralCode
        })
        .execute();

      return referralCode;
    } catch (error) {
      console.error('Error in generateReferralCode:', error);
      // If this is a "relation does not exist" error, create the table
      await createReferralCodesTable();
      // Retry once after creating the table
      return this.generateReferralCode(userId);
    }
  }

  // Saved Jobs
  async getSavedJobs(userId: number): Promise<SavedJob[]> {
    try {
      return await db
        .select()
        .from(savedJobs)
        .where(eq(savedJobs.userId, userId))
        .orderBy(desc(savedJobs.savedAt));
    } catch (error) {
      console.error('Error getting saved jobs:', error);
      return [];
    }
  }

  async getSavedJobsWithDetails(userId: number): Promise<(SavedJob & { job: Job })[]> {
    try {
      const userSavedJobs = await db
        .select()
        .from(savedJobs)
        .where(eq(savedJobs.userId, userId))
        .orderBy(desc(savedJobs.savedAt));

      // Fetch job details for each saved job
      const savedJobsWithDetails = await Promise.all(
        userSavedJobs.map(async (saved) => {
          const [jobDetails] = await db
            .select()
            .from(jobs)
            .where(eq(jobs.id, saved.jobId));
          
          return {
            ...saved,
            job: jobDetails
          };
        })
      );

      return savedJobsWithDetails;
    } catch (error) {
      console.error('Error getting saved jobs with details:', error);
      return [];
    }
  }

  async saveJob(savedJob: InsertSavedJob): Promise<SavedJob> {
    try {
      // Check if job is already saved
      const [existingSavedJob] = await db
        .select()
        .from(savedJobs)
        .where(
          and(
            eq(savedJobs.userId, savedJob.userId),
            eq(savedJobs.jobId, savedJob.jobId)
          )
        );

      if (existingSavedJob) {
        return existingSavedJob;
      }

      // If not, save the job
      const [newSavedJob] = await db
        .insert(savedJobs)
        .values({
          ...savedJob,
          savedAt: new Date().toISOString()
        })
        .returning();

      return newSavedJob;
    } catch (error) {
      console.error('Error saving job:', error);
      throw error;
    }
  }

  async unsaveJob(userId: number, jobId: number): Promise<void> {
    try {
      await db
        .delete(savedJobs)
        .where(
          and(
            eq(savedJobs.userId, userId),
            eq(savedJobs.jobId, jobId)
          )
        );
    } catch (error) {
      console.error('Error removing saved job:', error);
      throw error;
    }
  }

  async isJobSaved(userId: number, jobId: number): Promise<boolean> {
    try {
      const [savedJob] = await db
        .select()
        .from(savedJobs)
        .where(
          and(
            eq(savedJobs.userId, userId),
            eq(savedJobs.jobId, jobId)
          )
        );
      
      return !!savedJob;
    } catch (error) {
      console.error('Error checking if job is saved:', error);
      return false;
    }
  }

  // Reported jobs implementation
  async getReportedJobs(): Promise<ReportedJob[]> {
    try {
      return await db.select().from(reportedJobs).orderBy(desc(reportedJobs.createdAt));
    } catch (error) {
      console.error('Error fetching reported jobs:', error);
      throw error;
    }
  }

  async getReportedJobById(id: number): Promise<ReportedJob | undefined> {
    try {
      const [report] = await db
        .select()
        .from(reportedJobs)
        .where(eq(reportedJobs.id, id));
      
      return report;
    } catch (error) {
      console.error(`Error fetching reported job with ID ${id}:`, error);
      throw error;
    }
  }

  async getReportedJobsByUser(userId: number): Promise<ReportedJob[]> {
    try {
      return await db
        .select()
        .from(reportedJobs)
        .where(eq(reportedJobs.userId, userId))
        .orderBy(desc(reportedJobs.createdAt));
    } catch (error) {
      console.error(`Error fetching reported jobs for user ${userId}:`, error);
      throw error;
    }
  }

  async getReportedJobsByStatus(status: string): Promise<ReportedJob[]> {
    try {
      return await db
        .select()
        .from(reportedJobs)
        .where(eq(reportedJobs.status, status))
        .orderBy(desc(reportedJobs.createdAt));
    } catch (error) {
      console.error(`Error fetching reported jobs with status ${status}:`, error);
      throw error;
    }
  }

  async getReportedJobsWithDetails(): Promise<(ReportedJob & { job: Job; user: User })[]> {
    try {
      const reports = await db.select().from(reportedJobs).orderBy(desc(reportedJobs.createdAt));
      
      // Get all unique job IDs and user IDs from reports
      const jobIds = [...new Set(reports.map(report => report.jobId))];
      const userIds = [...new Set(reports.map(report => report.userId))];
      
      // Fetch all jobs and users in bulk
      const jobsData = await db.select().from(jobs).where(
        jobIds.length > 0 ? (jobs.id as any).in(jobIds) : undefined
      );
      
      const usersData = await db.select().from(users).where(
        userIds.length > 0 ? (users.id as any).in(userIds) : undefined
      );
      
      // Create maps for easy lookup
      const jobMap = Object.fromEntries(jobsData.map(job => [job.id, job]));
      const userMap = Object.fromEntries(usersData.map(user => [user.id, user]));
      
      // Combine the data
      return reports.map(report => ({
        ...report,
        job: jobMap[report.jobId],
        user: userMap[report.userId]
      }));
    } catch (error) {
      console.error('Error fetching reported jobs with details:', error);
      throw error;
    }
  }

  async reportJob(report: InsertReportedJob): Promise<ReportedJob> {
    try {
      const [newReport] = await db
        .insert(reportedJobs)
        .values({
          ...report,
          createdAt: new Date().toISOString(),
          status: 'pending'
        })
        .returning();
      
      return newReport;
    } catch (error) {
      console.error('Error reporting job:', error);
      throw error;
    }
  }

  async updateReportStatus(
    id: number, 
    status: string, 
    adminNotes?: string, 
    reviewedBy?: number
  ): Promise<ReportedJob> {
    try {
      const updates: any = {
        status,
        reviewedAt: new Date().toISOString()
      };

      if (adminNotes) {
        updates.adminNotes = adminNotes;
      }

      if (reviewedBy) {
        updates.reviewedBy = reviewedBy;
      }

      const [updatedReport] = await db
        .update(reportedJobs)
        .set(updates)
        .where(eq(reportedJobs.id, id))
        .returning();
      
      if (!updatedReport) {
        throw new Error(`Report with ID ${id} not found`);
      }
      
      return updatedReport;
    } catch (error) {
      console.error(`Error updating report status for ID ${id}:`, error);
      throw error;
    }
  }

  async deleteJobReport(id: number): Promise<void> {
    try {
      await db.delete(reportedJobs).where(eq(reportedJobs.id, id));
    } catch (error) {
      console.error(`Error deleting job report with ID ${id}:`, error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();