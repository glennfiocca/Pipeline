import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { InsertJob } from '@shared/schema';

export class LinkedInScraper extends BaseScraper {
  constructor() {
    super('https://www.linkedin.com/jobs');
  }

  async scrape(): Promise<InsertJob[]> {
    const jobs: InsertJob[] = [];

    try {
      // Test the connection with proper headers
      const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; PipelineBot/1.0; +https://pipeline.com)',
        'Accept': 'text/html',
      };

      // Search for different job types
      const jobTypes = ['software-engineer', 'data-scientist', 'financial-analyst'];
      const locations = ['united-states', 'remote'];

      for (const jobType of jobTypes) {
        for (const location of locations) {
          const url = `${this.baseUrl}/search?keywords=${jobType}&location=${location}`;

          if (!this.isAllowed(url)) {
            console.log(`Skipping ${url} - not allowed by robots.txt`);
            continue;
          }

          try {
            console.log(`Fetching jobs from: ${url}`);
            const response = await axios.get(url, { headers });
            const $ = cheerio.load(response.data);

            $('.job-card-container').each((_, element) => {
              const $job = $(element);

              const job: InsertJob = {
                title: $job.find('.job-card-list__title').text().trim(),
                company: $job.find('.job-card-container__company-name').text().trim(),
                location: $job.find('.job-card-container__metadata-item').text().trim() || 'Remote',
                salary: 'Competitive',
                description: $job.find('.job-card-list__description').text().trim() || 
                           'View full description on LinkedIn',
                requirements: 'See full listing on LinkedIn for requirements',
                source: 'LinkedIn',
                sourceUrl: $job.find('a.job-card-list__title').attr('href') || url,
                type: jobType.includes('financial') ? 'Finance' : 'STEM',
                published: true
              };

              if (this.validateJob(job)) {
                console.log('Found valid job:', {
                  title: job.title,
                  company: job.company,
                  type: job.type
                });
                jobs.push(job);
              }
            });

            // Be respectful with rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));

          } catch (error) {
            console.error(`Error fetching jobs for ${jobType} in ${location}:`, error);
          }
        }
      }

    } catch (error) {
      console.error('Error in LinkedIn scraper:', error);
    }

    console.log(`Found total of ${jobs.length} jobs from LinkedIn`);
    return jobs;
  }
}