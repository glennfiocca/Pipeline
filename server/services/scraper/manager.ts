import { LinkedInScraper } from './linkedin';
import { storage } from '../../storage';
import type { InsertJob } from '@shared/schema';

export class ScraperManager {
  private scrapers = [
    new LinkedInScraper(),
    // Add more scrapers here as we implement them
  ];

  async runScrapers() {
    console.log('Starting job scraping...');
    
    for (const scraper of this.scrapers) {
      try {
        const jobs = await scraper.scrape();
        console.log(`Found ${jobs.length} jobs from scraper`);
        
        // Store jobs in database
        for (const job of jobs) {
          try {
            await storage.createJob(job);
          } catch (error) {
            console.error('Error storing job:', error);
          }
        }
      } catch (error) {
        console.error('Scraper error:', error);
      }
    }
    
    console.log('Job scraping completed');
  }
}
