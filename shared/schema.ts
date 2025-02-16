import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: text("reset_token_expiry"),
  createdAt: text("created_at").notNull().default(new Date().toISOString())
});

// Base schema for database operations
const baseUserSchema = createInsertSchema(users).omit({ 
  id: true,
  resetToken: true,
  resetTokenExpiry: true,
  createdAt: true 
});

// Extended schema for registration with validation
export const insertUserSchema = baseUserSchema.extend({
  confirmPassword: z.string(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description").notNull(),
  salary: text("salary").notNull(),
  location: text("location").notNull(),
  requirements: text("requirements").notNull(),
  source: text("source").notNull(),
  sourceUrl: text("source_url").notNull(),
  type: text("type").notNull(),
  published: boolean("published").default(true)
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  title: text("title").notNull(),
  bio: text("bio").notNull(),
  location: text("location").notNull(),
  education: jsonb("education").notNull().default([]),
  experience: jsonb("experience").notNull().default([]),
  skills: text("skills").array().notNull().default([]),
  certifications: jsonb("certifications").notNull().default([]),
  languages: jsonb("languages").notNull().default([]),
  publications: jsonb("publications").default([]),
  projects: jsonb("projects").default([]),
  resumeUrl: text("resume_url"),
  transcriptUrl: text("transcript_url"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  githubUrl: text("github_url"),
  availability: text("availability").notNull(),
  workAuthorization: text("work_authorization").notNull(),
  visaSponsorship: boolean("visa_sponsorship").default(false),
  willingToRelocate: boolean("willing_to_relocate").default(false),
  preferredLocations: text("preferred_locations").array().default([]),
  salaryExpectation: text("salary_expectation"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull(),
  citizenshipStatus: text("citizenship_status").notNull(),
  veteranStatus: text("veteran_status"),
  militaryBranch: text("military_branch"),
  militaryServiceDates: text("military_service_dates"),
  referenceList: jsonb("reference_list").default([]),
  securityClearance: text("security_clearance"),
  clearanceType: text("clearance_type"),
  clearanceExpiry: text("clearance_expiry")
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  profileId: integer("profile_id").notNull(),
  status: text("status").notNull(),
  appliedAt: text("applied_at").notNull(),
  coverLetter: text("cover_letter"),
  applicationData: jsonb("application_data").notNull()
});

const educationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  field: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  gpa: z.string(),
  majorCourses: z.array(z.string()),
  transcriptUrl: z.string().nullable(),
  honors: z.array(z.string()),
  activities: z.array(z.string())
});

const experienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  current: z.boolean(),
  description: z.string(),
  achievements: z.array(z.string()),
  technologiesUsed: z.array(z.string()),
  responsibilities: z.array(z.string())
});

const certificationSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  issueDate: z.string(),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().optional(),
  certificateUrl: z.string().nullable()
});

const languageSchema = z.object({
  name: z.string(),
  proficiency: z.enum(["Basic", "Intermediate", "Advanced", "Native"]),
  certifications: z.array(z.string()).optional()
});

const publicationSchema = z.object({
  title: z.string(),
  publisher: z.string(),
  date: z.string(),
  url: z.string().optional(),
  description: z.string()
});

const projectSchema = z.object({
  name: z.string(),
  description: z.string(),
  role: z.string(),
  url: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  technologiesUsed: z.array(z.string()),
  achievements: z.array(z.string())
});

const referenceSchema = z.object({
  name: z.string(),
  title: z.string(),
  company: z.string(),
  email: z.string().email(),
  phone: z.string(),
  relationship: z.string()
});

export const insertProfileSchema = createInsertSchema(profiles).extend({
  education: z.array(educationSchema),
  experience: z.array(experienceSchema),
  certifications: z.array(certificationSchema),
  languages: z.array(languageSchema),
  publications: z.array(publicationSchema).optional(),
  projects: z.array(projectSchema).optional(),
  workAuthorization: z.enum(["US Citizen", "Green Card", "H1B", "Other"]),
  availability: z.enum(["Immediate", "2 Weeks", "1 Month", "Other"]),
  referenceList: z.array(referenceSchema).optional()
});

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true });

export type Job = typeof jobs.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Education = z.infer<typeof educationSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Reference = z.infer<typeof referenceSchema>;

import { boolean, integer, jsonb } from "drizzle-orm/pg-core";