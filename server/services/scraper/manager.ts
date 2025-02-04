import { IndeedScraper } from './indeed';
import { storage } from '../../storage';
import type { InsertJob } from '@shared/schema';

export class ScraperManager {
  private scraper = new IndeedScraper();

  async runScrapers() {
    console.log('Starting job generation...');
    const allJobs: InsertJob[] = [];

    try {
      console.log('Generating mock jobs...');
      const jobs = await this.scraper.scrape();
      console.log(`Generated ${jobs.length} jobs`);

      // Store jobs in database
      for (const job of jobs) {
        try {
          await storage.createJob(job);
          console.log('Stored job:', job.title, 'at', job.company);
        } catch (error) {
          console.error('Error storing job:', error);
        }
      }

      allJobs.push(...jobs);
    } catch (error) {
      console.error('Error generating jobs:', error);
    }

    console.log(`Job generation completed. Total jobs created: ${allJobs.length}`);
  }
}