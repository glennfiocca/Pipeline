import { IndeedScraper } from './indeed';
import { storage } from '../../storage';
import type { InsertJob } from '@shared/schema';
import { processJobPosting } from '../job-processor';

export class ScraperManager {
  private scraper = new IndeedScraper();

  async runScrapers(): Promise<InsertJob[]> {
    console.log('Starting job scraping process...');
    const allJobs: InsertJob[] = [];

    try {
      // Get raw job postings
      console.log('Fetching raw job postings...');
      const rawJobPostings = await this.scraper.scrape();
      console.log(`Found ${rawJobPostings.length} raw job postings`);

      // Process each job posting through GPT
      console.log('Processing job postings with GPT...');
      for (const rawPosting of rawJobPostings) {
        try {
          // Process the raw HTML through GPT
          const processedJob = await processJobPosting(rawPosting);

          // Store the processed job
          const storedJob = await storage.createJob(processedJob);
          console.log('Stored processed job:', storedJob.title, 'at', storedJob.company);

          allJobs.push(storedJob);
        } catch (error) {
          console.error('Error processing/storing job:', error);
        }

        // Small delay between GPT calls to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error('Error in scraping process:', error);
    }

    console.log(`Job scraping completed. Total jobs processed and stored: ${allJobs.length}`);
    return allJobs;
  }
}