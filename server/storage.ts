import { jobs, profiles, applications } from "@shared/schema";
import type { Job, Profile, Application, InsertJob, InsertProfile, InsertApplication } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;

  // Profiles
  getProfiles(): Promise<Profile[]>;
  getProfile(id: number): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;

  // Applications
  getApplications(): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: string): Promise<Application>;
}

export class DatabaseStorage implements IStorage {
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

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    // Ensure arrays are properly stringified before storage
    const profileToInsert = {
      ...insertProfile,
      education: insertProfile.education.map(edu => JSON.stringify(edu)),
      experience: insertProfile.experience.map(exp => JSON.stringify(exp)),
      skills: insertProfile.skills || [],
      certifications: insertProfile.certifications || [],
      languages: insertProfile.languages || [],
    };

    const [profile] = await db.insert(profiles)
      .values(profileToInsert)
      .returning();

    return profile;
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
}

export const storage = new DatabaseStorage();