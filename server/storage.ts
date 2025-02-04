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
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile>;

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

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.email, email));
    return profile;
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    try {
      // First check if a profile with this email already exists
      const existingProfile = await this.getProfileByEmail(insertProfile.email);

      if (existingProfile) {
        // If it exists, update it instead
        return await this.updateProfile(existingProfile.id, insertProfile);
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
}

export const storage = new DatabaseStorage();