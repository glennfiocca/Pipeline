import { jobs, profiles, applications, users } from "@shared/schema";
import type { Job, Profile, Application, User, InsertJob, InsertProfile, InsertApplication, InsertUser } from "@shared/schema";
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

  // New user-related interfaces
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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
      pool: db.client,
      createTableIfMissing: true
    });
  }

  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
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
    try {
      // First check if a profile with this email already exists
      const existingProfile = await this.getProfileByEmail(insertProfile.email);

      if (existingProfile) {
        throw new Error(`A profile with email ${insertProfile.email} already exists`);
      }

      // Ensure all arrays are properly initialized
      const profileData = {
        ...insertProfile,
        education: insertProfile.education || [],
        experience: insertProfile.experience || [],
        skills: insertProfile.skills || [],
        certifications: insertProfile.certifications || [],
        languages: insertProfile.languages || [],
        publications: insertProfile.publications || [],
        projects: insertProfile.projects || [],
        referenceList: insertProfile.referenceList || [],
        preferredLocations: insertProfile.preferredLocations || []
      };

      const [profile] = await db.insert(profiles).values(profileData).returning();
      return profile;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async updateProfile(id: number, updateProfile: Partial<InsertProfile>): Promise<Profile> {
    try {
      // First get the existing profile
      const existingProfile = await this.getProfile(id);
      if (!existingProfile) {
        throw new Error('Profile not found');
      }

      // If email is being changed, check if the new email is already taken by another profile
      if (updateProfile.email && updateProfile.email !== existingProfile.email) {
        const emailExists = await this.getProfileByEmail(updateProfile.email);
        if (emailExists && emailExists.id !== id) {
          throw new Error(`Email ${updateProfile.email} is already taken`);
        }
      }

      // Clean up the update data to handle arrays properly
      const updateData = Object.fromEntries(
        Object.entries(updateProfile)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => [
            key,
            Array.isArray(value) ? value.filter(Boolean) : value
          ])
      ) as Partial<InsertProfile>;

      const [profile] = await db.update(profiles)
        .set(updateData)
        .where(eq(profiles.id, id))
        .returning();

      if (!profile) {
        throw new Error('Profile not found');
      }

      return profile;
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
    const [application] = await db.insert(applications).values(insertApplication).returning();
    return application;
  }

  async updateApplicationStatus(id: number, status: string): Promise<Application> {
    const [application] = await db
      .update(applications)
      .set({ status })
      .where(eq(applications.id, id))
      .returning();

    if (!application) {
      throw new Error("Application not found");
    }

    return application;
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

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
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
}

export const storage = new DatabaseStorage();