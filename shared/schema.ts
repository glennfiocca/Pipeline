import { pgTable, text, serial, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from 'drizzle-orm';

// Remove referral-related fields from user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  resetToken: text("reset_token"),
  resetTokenExpiry: text("reset_token_expiry"),
  timezone: text("timezone").notNull().default("UTC"),
  bankedCredits: integer("banked_credits").notNull().default(0),
  lastCreditReset: text("last_credit_reset").notNull().default(new Date().toISOString()),
  createdAt: text("created_at").notNull().default(new Date().toISOString())
});

// Update user schema for registration
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  resetToken: true,
  resetTokenExpiry: true,
  createdAt: true,
  timezone: true,
  bankedCredits: true,
  lastCreditReset: true
}).extend({
  confirmPassword: z.string(),
  username: z.string().min(3, "Username must be at least 3 characters").transform(val => val.toLowerCase()),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Base schema for database operations
const baseUserSchema = createInsertSchema(users).omit({ 
  id: true,
  resetToken: true,
  resetTokenExpiry: true,
  createdAt: true
});

// Jobs table schema update
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  jobIdentifier: text("job_identifier").notNull().unique(), // New field
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description").notNull(),
  salary: text("salary").notNull(),
  location: text("location").notNull(),
  requirements: text("requirements").notNull(),
  source: text("source").notNull(),
  sourceUrl: text("source_url").notNull(),
  type: text("type").notNull(),
  published: boolean("published").default(true),
  isActive: boolean("is_active").default(true),
  lastCheckedAt: text("last_checked_at").notNull().default(new Date().toISOString()),
  deactivatedAt: text("deactivated_at")
});

// Update insert job schema
export const insertJobSchema = createInsertSchema(jobs).omit({ 
  id: true,
  lastCheckedAt: true,
  deactivatedAt: true 
}).extend({
  jobIdentifier: z.string().regex(/^PL\d{6}$/, "Job identifier must be 'PL' followed by 6 digits")
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(), 
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
  clearanceExpiry: text("clearance_expiry"),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
});

// Add explicit relations
export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  profileId: integer("profile_id").notNull(),
  status: text("status").notNull(),
  appliedAt: text("applied_at").notNull(),
  coverLetter: text("cover_letter"),
  applicationData: jsonb("application_data").notNull(),
  lastStatusUpdate: text("last_status_update").notNull().default(new Date().toISOString()),
  statusHistory: jsonb("status_history").notNull().default([]),
  notes: text("notes"),
  nextStep: text("next_step"),
  nextStepDueDate: text("next_step_due_date")
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
  company: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isPresent: z.boolean().optional().default(false),
  description: z.string().optional()
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
  name: z.string().optional(),
  description: z.string().optional(),
  role: z.string(),
  url: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isPresent: z.boolean().optional().default(false),
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

// Create the insert profile schema with all fields optional
export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true
}).extend({
  // Make all fields optional
  name: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.coerce.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  address: z.coerce.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.coerce.string().optional(),
  country: z.string().optional(),
  workAuthorization: z.string().optional(),
  availability: z.string().optional(),
  citizenshipStatus: z.string().optional(),

  // Make array fields optional with simpler validation
  education: z.array(z.any()).optional().default([]),
  experience: z.array(z.any()).optional().default([]),
  skills: z.array(z.union([z.string(), z.record(z.string())])).optional().default([]),
  certifications: z.array(z.any()).optional().default([]),
  languages: z.array(z.any()).optional().default([]),
  publications: z.array(z.any()).optional().default([]),
  projects: z.array(z.any()).optional().default([]),

  // Optional fields
  resumeUrl: z.string().optional().nullable(),
  transcriptUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  portfolioUrl: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
  visaSponsorship: z.boolean().optional(),
  willingToRelocate: z.boolean().optional(),
  preferredLocations: z.array(z.string()).optional().default([]),
  salaryExpectation: z.string().optional().nullable(),
  veteranStatus: z.string().optional().nullable(),
  militaryBranch: z.string().optional().nullable(),
  militaryServiceDates: z.string().optional().nullable(),
  referenceList: z.array(z.any()).optional().default([]),
  securityClearance: z.string().optional().nullable(),
  clearanceType: z.string().optional().nullable(),
  clearanceExpiry: z.string().optional().nullable(),

  // If the client might send userId as a string, coerce it to number
  userId: z.coerce.number()
});

export const insertApplicationSchema = createInsertSchema(applications).omit({ 
  id: true 
}).extend({
  status: z.enum([
    "Applied",
    "Screening",
    "Interviewing",
    "Offered",
    "Accepted",
    "Rejected",
    "Withdrawn"
  ])
});

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

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  content: text("content").notNull(),
  isFromAdmin: boolean("is_from_admin").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  metadata: jsonb("metadata").default({}),
  senderUsername: text("sender_username") 
});

export const insertMessageSchema = createInsertSchema(messages).extend({
  applicationId: z.number(),
  content: z.string().min(1, "Message content cannot be empty"),
  isFromAdmin: z.boolean(),
  senderUsername: z.string().min(1, "Sender username is required"),
  isRead: z.boolean().default(false),
  createdAt: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Types remain unchanged except for Message which will now include senderUsername
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  rating: integer("rating").notNull(),
  subject: text("subject").notNull(),
  comment: text("comment"),
  category: text("category").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  resolved: boolean("resolved").notNull().default(false),
  adminResponse: text("admin_response"),
  internalNotes: text("internal_notes"),
  archived: boolean("archived").notNull().default(false),
  metadata: jsonb("metadata").default({})
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
  resolved: true,
  adminResponse: true,
  internalNotes: true,
  archived: true
}).extend({
  rating: z.number().min(1).max(5),
  subject: z.string().min(3, "Please provide a subject").max(100, "Subject is too long"),
  category: z.enum(["bug", "feature", "general", "ui", "other"]),
  status: z.enum(["pending", "in_progress", "resolved", "rejected", "received"])
});

// Types remain unchanged except for Feedback which will now include new fields
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// Add notifications table schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'application_status', 'feedback_response', 'application_confirmation'
  title: text("title").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  relatedId: integer("related_id"), // ID of related entity (application/feedback)
  relatedType: text("related_type"), // Type of related entity ('application', 'feedback')
  metadata: jsonb("metadata").default({}),
  createdAt: text("created_at").notNull().default(new Date().toISOString())
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
}).extend({
  type: z.enum([
    'application_status',
    'feedback_response',
    'application_confirmation',
    'message_received'
  ]),
  relatedType: z.enum(['application', 'feedback', 'message']).optional(),
  metadata: z.object({
    oldStatus: z.string().optional(),
    newStatus: z.string().optional(),
    applicationId: z.number().optional(),
    feedbackId: z.number().optional(),
    messageId: z.number().optional()
  }).optional()
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;