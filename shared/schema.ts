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
  title: text("title").notNull(),
  bio: text("bio").notNull(),
  skills: text("skills").array().notNull(),
  experience: jsonb("experience").notNull()
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  profileId: integer("profile_id").notNull(),
  status: text("status").notNull(), // applied, interviewing, rejected, accepted
  appliedAt: text("applied_at").notNull()
});

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true });

export type Job = typeof jobs.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
