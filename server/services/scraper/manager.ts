import { LinkedInScraper } from './linkedin';
import { HiringCafeScraper } from './hiringcafe';
import { IndeedScraper } from './indeed';
import { storage } from '../../storage';
import type { InsertJob } from '@shared/schema';

export class ScraperManager {
  private scrapers = [
    new HiringCafeScraper(),
    new IndeedScraper(),
    new LinkedInScraper()
  ];

  async runScrapers() {
    console.log('Starting job scraping...');
    const allJobs: InsertJob[] = [];

    for (const scraper of this.scrapers) {
      try {
        console.log(`Running scraper: ${scraper.constructor.name}`);
        const jobs = await scraper.scrape();
        console.log(`Found ${jobs.length} jobs from ${scraper.constructor.name}`);

        // Deduplicate jobs based on title + company
        const newJobs = jobs.filter(job => {
          const isDuplicate = allJobs.some(
            existing => 
              existing.title.toLowerCase() === job.title.toLowerCase() &&
              existing.company.toLowerCase() === job.company.toLowerCase()
          );
          return !isDuplicate;
        });

        allJobs.push(...newJobs);

        // Store jobs in database
        for (const job of newJobs) {
          try {
            await storage.createJob(job);
            console.log('Stored job:', job.title, 'at', job.company);
          } catch (error) {
            console.error('Error storing job:', error);
          }
        }
      } catch (error) {
        console.error(`Scraper error in ${scraper.constructor.name}:`, error);
      }
    }

    console.log(`Job scraping completed. Total unique jobs found: ${allJobs.length}`);
  }
}