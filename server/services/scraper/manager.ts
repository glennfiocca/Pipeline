import { IndeedScraper } from './indeed';
import { storage } from '../../storage';
import type { InsertJob } from '@shared/schema';

export class ScraperManager {
  private scraper = new IndeedScraper();

  async runScrapers(): Promise<InsertJob[]> {
    console.log('Starting job scraping process...');
    const allJobs: InsertJob[] = [];

    try {
      // Get jobs from Indeed
      console.log('Fetching jobs from Indeed...');
      const jobs = await this.scraper.scrape();
      console.log(`Found ${jobs.length} jobs from Indeed`);

      // Store each job in the database
      console.log('Storing jobs in database...');
      for (const job of jobs) {
        try {
          const storedJob = await storage.createJob(job);
          console.log('Stored job:', storedJob.title, 'at', storedJob.company);
          allJobs.push(storedJob);
        } catch (error) {
          console.error('Error storing job:', error);
        }
      }

    } catch (error) {
      console.error('Error in scraping process:', error);
      throw error; // Re-throw to let the route handler catch it
    }

    console.log(`Job scraping completed. Total jobs stored: ${allJobs.length}`);
    return allJobs;
  }
}