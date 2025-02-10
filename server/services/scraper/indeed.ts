import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { InsertJob } from '@shared/schema';

export class IndeedScraper extends BaseScraper {
  constructor() {
    super('https://www.indeed.com', 1); // Use 1 concurrent request to respect rate limits
  }

  async scrape(): Promise<InsertJob[]> {
    const jobs: InsertJob[] = [];

    try {
      await this.init(); // Initialize robots.txt parser
      console.log('Starting Indeed scraper...');

      const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; PipelineBot/1.0; +https://pipeline.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      };

      // Search for different job types
      const jobTypes = ['software engineer', 'data scientist', 'frontend developer'];
      const locations = ['Remote', 'New York, NY', 'San Francisco, CA'];

      for (const query of jobTypes) {
        for (const location of locations) {
          const url = `${this.baseUrl}/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;

          if (!this.isAllowed(url)) {
            console.log(`Skipping ${url} - not allowed by robots.txt`);
            continue;
          }

          try {
            console.log(`Fetching jobs for ${query} in ${location} from URL: ${url}`);
            const response = await axios.get(url, { 
              headers,
              timeout: 10000,
              validateStatus: (status) => status < 500 // Accept any status < 500
            });

            console.log('Response received:', {
              status: response.status,
              contentType: response.headers['content-type'],
              dataLength: response.data.length
            });

            const $ = cheerio.load(response.data);

            // Updated selectors for Indeed's current structure
            $('.job_seen_beacon, .jobsearch-ResultsList .result').each((_, element) => {
              try {
                const $job = $(element);
                console.log('Processing job element:', $job.html()?.substring(0, 100));

                const job: InsertJob = {
                  title: $job.find('[class*="jobTitle"], .title').first().text().trim(),
                  company: $job.find('[class*="companyName"], .company').first().text().trim(),
                  location: $job.find('[class*="companyLocation"], .location').first().text().trim() || location,
                  salary: $job.find('[class*="salary-snippet"], .salaryText').first().text().trim() || 'Competitive',
                  description: $job.find('[class*="job-snippet"], .summary').first().text().trim() || 
                              'Visit Indeed for full job description',
                  requirements: $job.find('[class*="job-requirements"], .requirements').first().text().trim() || 
                               'Experience in relevant field required. See full listing for details.',
                  source: 'Indeed',
                  sourceUrl: this.baseUrl + ($job.find('a[class*="jcs-JobTitle"]').attr('href') || ''),
                  type: 'Full-time',
                  published: true
                };

                if (this.validateJob(job)) {
                  console.log('Found valid job:', {
                    title: job.title,
                    company: job.company,
                    location: job.location
                  });
                  jobs.push(job);
                } else {
                  console.log('Invalid job data:', job);
                }
              } catch (error) {
                console.error('Error parsing job element:', error);
              }
            });

            // Respect rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));

          } catch (error) {
            console.error(`Error fetching jobs for ${query} in ${location}:`, error);
          }
        }
      }

    } catch (error) {
      console.error('Error in Indeed scraper:', error);
    }

    console.log(`Found total of ${jobs.length} jobs from Indeed`);
    return jobs;
  }
}