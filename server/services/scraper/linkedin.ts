import puppeteer from 'puppeteer';
import { BaseScraper } from './base';
import type { InsertJob } from '@shared/schema';

export class LinkedInScraper extends BaseScraper {
  constructor() {
    super('https://www.linkedin.com', 2); // 2 concurrent requests
  }

  async scrape(): Promise<InsertJob[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const jobs: InsertJob[] = [];

    try {
      const page = await browser.newPage();
      
      // Search for STEM and Finance jobs
      const searchUrls = [
        'https://www.linkedin.com/jobs/search/?keywords=software%20engineer',
        'https://www.linkedin.com/jobs/search/?keywords=data%20scientist',
        'https://www.linkedin.com/jobs/search/?keywords=financial%20analyst'
      ];

      for (const url of searchUrls) {
        if (!this.isAllowed(url)) {
          console.log(`Skipping ${url} - not allowed by robots.txt`);
          continue;
        }

        await this.queue.add(async () => {
          try {
            await page.goto(url, { waitUntil: 'networkidle0' });
            
            // Wait for job cards to load
            await page.waitForSelector('.job-card-container');

            const jobListings = await page.evaluate(() => {
              const cards = document.querySelectorAll('.job-card-container');
              return Array.from(cards).map(card => ({
                title: card.querySelector('.job-card-list__title')?.textContent?.trim(),
                company: card.querySelector('.job-card-container__company-name')?.textContent?.trim(),
                location: card.querySelector('.job-card-container__metadata-item')?.textContent?.trim(),
                salary: 'Competitive', // LinkedIn often doesn't show salary
                description: card.querySelector('.job-card-list__description')?.textContent?.trim(),
                requirements: 'See full listing', // Detailed in full listing
                sourceUrl: card.querySelector('a')?.href,
                source: 'LinkedIn',
                type: 'STEM', // We'll categorize based on search keywords
                published: true
              }));
            });

            // Filter and validate jobs
            const validJobs = jobListings.filter(this.validateJob);
            jobs.push(...validJobs);

          } catch (error) {
            console.error('Error scraping LinkedIn jobs:', error);
          }
        });
      }

    } finally {
      await browser.close();
    }

    return jobs;
  }
}
