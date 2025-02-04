import { Job, Profile, Application, InsertJob, InsertProfile, InsertApplication } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private jobs: Map<number, Job>;
  private profiles: Map<number, Profile>;
  private applications: Map<number, Application>;
  private jobId: number;
  private profileId: number;
  private applicationId: number;

  constructor() {
    this.jobs = new Map();
    this.profiles = new Map();
    this.applications = new Map();
    this.jobId = 1;
    this.profileId = 1;
    this.applicationId = 1;
  }

  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.jobId++;
    const job = { ...insertJob, id };
    this.jobs.set(id, job);
    return job;
  }

  async getProfiles(): Promise<Profile[]> {
    return Array.from(this.profiles.values());
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    return this.profiles.get(id);
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const id = this.profileId++;
    const profile = { ...insertProfile, id };
    this.profiles.set(id, profile);
    return profile;
  }

  async getApplications(): Promise<Application[]> {
    return Array.from(this.applications.values());
  }

  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.applicationId++;
    const application = { ...insertApplication, id };
    this.applications.set(id, application);
    return application;
  }

  async updateApplicationStatus(id: number, status: string): Promise<Application> {
    const application = await this.getApplication(id);
    if (!application) throw new Error("Application not found");
    
    const updated = { ...application, status };
    this.applications.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
