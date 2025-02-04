import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  type: text("type").notNull(), // STEM, Finance, etc
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
  education: jsonb("education").array().notNull(), // Array of education history
  experience: jsonb("experience").array().notNull(), // Array of work experience
  skills: text("skills").array().notNull(),
  certifications: jsonb("certifications").array().notNull(),
  languages: jsonb("languages").array().notNull(),
  resumeUrl: text("resume_url"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  availability: text("availability").notNull(), // immediate, 2 weeks, etc.
  workAuthorization: text("work_authorization").notNull(),
  // Fields for autofill
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull(),
  citizenshipStatus: text("citizenship_status").notNull()
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  profileId: integer("profile_id").notNull(),
  status: text("status").notNull(), // applied, interviewing, rejected, accepted
  appliedAt: text("applied_at").notNull(),
  coverLetter: text("cover_letter"),
  applicationData: jsonb("application_data").notNull() // Store form data submitted
});

// Create Zod schemas for education and experience
const educationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  field: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  gpa: z.string().optional(),
  activities: z.array(z.string()).optional()
});

const experienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  current: z.boolean(),
  description: z.string(),
  achievements: z.array(z.string()).optional()
});

const certificationSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  issueDate: z.string(),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional()
});

const languageSchema = z.object({
  name: z.string(),
  proficiency: z.enum(['Basic', 'Intermediate', 'Advanced', 'Native'])
});

// Extend the profile schema with the new fields
export const insertProfileSchema = createInsertSchema(profiles).extend({
  education: z.array(educationSchema),
  experience: z.array(experienceSchema),
  certifications: z.array(certificationSchema),
  languages: z.array(languageSchema),
  workAuthorization: z.enum(['US Citizen', 'Green Card', 'H1B', 'Other']),
  availability: z.enum(['Immediate', '2 Weeks', '1 Month', 'Other'])
});

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true });

export type Job = typeof jobs.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

// Export additional types for components
export type Education = z.infer<typeof educationSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type Language = z.infer<typeof languageSchema>;