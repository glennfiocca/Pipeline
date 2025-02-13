import { jobs, profiles, applications, users, type Job, type Profile, type Application, type User, type InsertJob, type InsertProfile, type InsertApplication, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

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
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: db.$client,
      createTableIfMissing: true
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

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values({
      ...insertJob,
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
    const [updatedProfile] = await db
      .update(profiles)
      .set(profile)
      .where(eq(profiles.id, id))
      .returning();
    return updatedProfile;
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
    const [application] = await db
      .insert(applications)
      .values({
        ...insertApplication,
        appliedAt: now,
        lastStatusUpdate: now,
        statusHistory: [{
          status: "Applied",
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
    const newHistoryEntry = {
      status,
      date: now
    };

    // Ensure statusHistory is always an array
    const currentHistory = Array.isArray(currentApp.statusHistory) ? currentApp.statusHistory : [];
    const updatedHistory = [...currentHistory, newHistoryEntry];

    const [application] = await db
      .update(applications)
      .set({
        status,
        lastStatusUpdate: now,
        statusHistory: updatedHistory
      })
      .where(eq(applications.id, id))
      .returning();

    return application;
  }
}

export const storage = new DatabaseStorage();