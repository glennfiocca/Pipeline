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
  updateProfile(id: number, profile: InsertProfile): Promise<Profile>;

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
    console.log('Creating new profile with data:', insertProfile);

    // Ensure arrays are properly stringified before storage
    const profileToInsert = {
      ...insertProfile,
      education: insertProfile.education.map(edu => JSON.stringify(edu)),
      experience: insertProfile.experience.map(exp => JSON.stringify(exp)),
      skills: insertProfile.skills || [],
      certifications: insertProfile.certifications || [],
      languages: insertProfile.languages || [],
    };

    try {
      const [profile] = await db.insert(profiles)
        .values(profileToInsert)
        .returning();

      console.log('Created new profile:', profile);
      return profile;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async updateProfile(id: number, updateProfile: InsertProfile): Promise<Profile> {
    console.log('Updating profile', id, 'with data:', updateProfile);

    const profileToUpdate = {
      ...updateProfile,
      education: updateProfile.education.map(edu => JSON.stringify(edu)),
      experience: updateProfile.experience.map(exp => JSON.stringify(exp)),
      skills: updateProfile.skills || [],
      certifications: updateProfile.certifications || [],
      languages: updateProfile.languages || [],
    };

    try {
      const [profile] = await db.update(profiles)
        .set(profileToUpdate)
        .where(eq(profiles.id, id))
        .returning();

      if (!profile) {
        throw new Error('Profile not found');
      }

      console.log('Updated profile:', profile);
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
}

export const storage = new DatabaseStorage();