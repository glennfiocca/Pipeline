import OpenAI from "openai";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { jobs } from "@shared/schema";
import PQueue from "p-queue";

// Initialize OpenAI client
const openai = new OpenAI();

// Create a queue for rate limiting API calls
const queue = new PQueue({ concurrency: 1 });

// Schema for the structured job data we want to extract
const jobExtractionSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  type: z.string(),
  salary: z.string(),
  description: z.string(),
  requirements: z.array(z.string()),
  benefits: z.array(z.string()),
  skills: z.array(z.string()),
  experience_level: z.string(),
  remote_policy: z.string(),
});

export type JobExtraction = z.infer<typeof jobExtractionSchema>;

// Function to process a raw job posting using OpenAI
export async function processJobPosting(rawJobText: string): Promise<JobExtraction> {
  const result = await queue.add(async () => {
    try {
      const response = await openai.chat.completions.create({
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a job posting analyzer. Extract and structure key information from job postings.
            Output must be valid JSON matching this schema:
            {
              "title": "Job title",
              "company": "Company name",
              "location": "Location (standardized format: City, State or Remote)",
              "type": "Full-time/Part-time/Contract",
              "salary": "Salary range or 'Not specified'",
              "description": "Concise job description",
              "requirements": ["Array of key requirements"],
              "benefits": ["Array of benefits"],
              "skills": ["Array of required skills"],
              "experience_level": "Entry/Mid/Senior/Lead",
              "remote_policy": "Remote/Hybrid/On-site"
            }

            Infer missing information when possible. Keep arrays concise (3-5 items).
            Standardize formatting and normalize variations.`
          },
          {
            role: "user",
            content: rawJobText
          }
        ],
        temperature: 0.1, // Low temperature for consistent formatting
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      const result = JSON.parse(content);
      return jobExtractionSchema.parse(result);
    } catch (error) {
      console.error("Error processing job posting:", error);
      throw new Error("Failed to process job posting: " + (error as Error).message);
    }
  });

  return result;
}

// Process multiple job postings in parallel with rate limiting
export async function processBatchJobPostings(rawJobTexts: string[]): Promise<JobExtraction[]> {
  const results: JobExtraction[] = [];
  const errors: Error[] = [];

  await Promise.all(
    rawJobTexts.map(async (text) => {
      try {
        const result = await processJobPosting(text);
        results.push(result);
      } catch (error) {
        errors.push(error as Error);
      }
    })
  );

  if (errors.length > 0) {
    console.error(`Failed to process ${errors.length} job postings:`, errors);
  }

  return results;
}