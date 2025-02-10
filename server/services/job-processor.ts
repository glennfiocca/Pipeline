import OpenAI from "openai";
import { z } from "zod";
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
  requirements: z.string(),
  source: z.string().default('AI Processed'),
  sourceUrl: z.string().default(''),
  published: z.boolean().default(true)
});

export type JobExtraction = z.infer<typeof jobExtractionSchema>;

// Function to normalize requirements to string format
function normalizeRequirements(requirements: unknown): string {
  if (typeof requirements === 'string') return requirements;
  if (Array.isArray(requirements)) return requirements.join('; ');
  return 'No specific requirements listed';
}

// Function to process a raw job posting using OpenAI
export async function processJobPosting(rawJobText: string): Promise<JobExtraction> {
  return queue.add(async () => {
    try {
      console.log('Attempting to process job posting with OpenAI API...');

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125", // Using the latest GPT-3.5 model for cost efficiency
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a job posting analyzer that extracts structured information from job listings.
            Return a clean, structured JSON object with these exact fields:
            {
              "title": "Clear job title, standardized",
              "company": "Company name only",
              "location": "City, State format or Remote",
              "type": "Full-time/Part-time/Contract",
              "salary": "Standardized salary range or Competitive",
              "description": "2-3 sentence summary of role and responsibilities",
              "requirements": "All requirements as semicolon-separated string",
              "source": "AI Processed",
              "sourceUrl": "",
              "published": true
            }

            RULES:
            1. requirements MUST be a single string with items separated by semicolons
            2. Combine ALL qualifications, skills, and requirements into the requirements field
            3. Keep description concise but informative
            4. Standardize location format to "City, State" or "Remote"
            5. Return ONLY these exact fields with no additional data`
          },
          {
            role: "user",
            content: rawJobText
          }
        ],
        temperature: 0.1, // Low temperature for consistent formatting
        max_tokens: 1000,
      });

      console.log('OpenAI API response received successfully');

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      console.log('Parsing OpenAI response...');
      const result = JSON.parse(content);

      // Ensure requirements is a string
      const normalizedResult = {
        ...result,
        requirements: normalizeRequirements(result.requirements)
      };

      console.log('Validating parsed data against schema...');
      return jobExtractionSchema.parse(normalizedResult);

    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        console.error("OpenAI API Error:", {
          status: error.status,
          message: error.message,
          code: error.code,
          type: error.type
        });
      } else {
        console.error("Error processing job posting:", error);
      }
      throw error;
    }
  }) as Promise<JobExtraction>;
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