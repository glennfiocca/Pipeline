import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { InsertJob } from '@shared/schema';

export class BlackstoneScraper extends BaseScraper {
  constructor() {
    super('https://careers.blackstone.com', 1);
  }

  async scrape(): Promise<InsertJob[]> {
    const jobs: InsertJob[] = [];

    try {
      console.log('Starting Blackstone careers scraper...');
      
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      };

      // First fetch the jobs listing page
      const response = await axios.get(`${this.baseUrl}/jobs/search`, { 
        headers,
        timeout: 30000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      console.log('Successfully loaded Blackstone careers page');

      // Parse job listings
      $('.job-listing, .careers-job-item, article.job').each((_, element) => {
        try {
          const $job = $(element);
          
          const title = $job.find('.job-title, h2, .position-title').first().text().trim();
          const location = $job.find('.location, .job-location').first().text().trim();
          const jobUrl = $job.find('a').attr('href');
          
          // Get full description if available
          const description = $job.find('.description, .job-description, .summary').first().text().trim();
          const requirements = $job.find('.requirements, .qualifications').first().text().trim();

          const job: InsertJob = {
            title,
            company: 'Blackstone',
            location: location || 'New York, NY',
            salary: 'Competitive',
            description: description || 'Please see full job description on Blackstone careers',
            requirements: requirements || 'Please see full job posting for detailed requirements',
            source: 'Blackstone Careers',
            sourceUrl: jobUrl ? new URL(jobUrl, this.baseUrl).toString() : this.baseUrl,
            type: 'Full-time',
            published: true
          };

          if (this.validateJob(job)) {
            console.log('Found valid Blackstone job:', {
              title: job.title,
              location: job.location
            });
            jobs.push(job);
          }
        } catch (error) {
          console.error('Error parsing job element:', error);
        }
      });

    } catch (error: any) {
      console.error('Blackstone scraping error:', {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url
      });
    }

    console.log(`Successfully scraped ${jobs.length} Blackstone jobs`);
    return jobs;
  }
}
