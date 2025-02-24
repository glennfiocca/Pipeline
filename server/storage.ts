import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { 
  messages, applications, jobs, profiles, users, feedback, notifications,
  type Message, type InsertMessage,
  type Job, type Profile, type Application, type User,
  type InsertJob, type InsertProfile, type InsertApplication, type InsertUser,
  type Feedback, type InsertFeedback,
  type Notification, type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { nanoid } from 'nanoid';

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
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Pick<InsertUser, "username" | "email" | "password"> & { createdAt: string }): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User>;
  updateUserResetToken(id: number, token: string, expiry: string): Promise<User>;
  clearUserResetToken(id: number): Promise<User>;

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

  // Notification methods
  getNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
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
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: Pick<InsertUser, "username" | "email" | "password"> & { createdAt: string }): Promise<User> {
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

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const [profile] = await db.insert(profiles).values(insertProfile).returning();
    return profile;
  }

  async updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile> {
    try {
      const [existingProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, id));

      if (!existingProfile) {
        throw new Error(`Profile with ID ${id} not found`);
      }

      const [updatedProfile] = await db
        .update(profiles)
        .set({
          ...profile,
          // Convert arrays to proper format if they exist in the update
          education: Array.isArray(profile.education) ? profile.education : existingProfile.education,
          experience: Array.isArray(profile.experience) ? profile.experience : existingProfile.experience,
          skills: Array.isArray(profile.skills) ? profile.skills : existingProfile.skills,
          certifications: Array.isArray(profile.certifications) ? profile.certifications : existingProfile.certifications,
          languages: Array.isArray(profile.languages) ? profile.languages : existingProfile.languages,
          publications: Array.isArray(profile.publications) ? profile.publications : existingProfile.publications,
          projects: Array.isArray(profile.projects) ? profile.projects : existingProfile.projects,
          preferredLocations: Array.isArray(profile.preferredLocations) ? profile.preferredLocations : existingProfile.preferredLocations
        })
        .where(eq(profiles.id, id))
        .returning();

      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
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
    const [result] = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, id));
    return result;
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
}

export const storage = new DatabaseStorage();