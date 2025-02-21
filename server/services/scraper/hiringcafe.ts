import { BaseScraper } from './base';
import type { InsertJob } from '@shared/schema';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class HiringCafeScraper extends BaseScraper {
  constructor() {
    super('https://hiring.cafe', 1); // Use 1 concurrent request to be respectful
  }

  async scrape(): Promise<InsertJob[]> {
    const jobs: InsertJob[] = [];

    try {
      await this.init(); // Initialize robots.txt parser
      console.log('Starting hiring.cafe scraper...');

      // Test connection first with proper headers
      const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; PipelineBot/1.0; +https://pipeline.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      };

      try {
        // First make a test request to check if the site is accessible
        const testResponse = await axios.get(this.baseUrl, { 
          headers,
          timeout: 10000,
          validateStatus: (status) => status < 500 // Accept any status < 500
        });

        console.log('Successfully connected to hiring.cafe');
        console.log('Response status:', testResponse.status);
        console.log('Content type:', testResponse.headers['content-type']);

        // Try both the homepage and search page
        const urls = [
          this.baseUrl,
          `${this.baseUrl}/jobs`,
          `${this.baseUrl}/jobs/software-engineer`,
          `${this.baseUrl}/search?q=software+engineer`
        ];

        for (const url of urls) {
          if (!this.isAllowed(url)) {
            console.log(`Skipping ${url} - not allowed by robots.txt`);
            continue;
          }

          console.log(`\nTrying URL: ${url}`);
          const response = await axios.get(url, { headers, timeout: 10000 });
          const $ = cheerio.load(response.data);

          // Log the page structure
          console.log('Page title:', $('title').text());
          console.log('Main content:', $('main').length ? 'Found' : 'Not found');
          console.log('Content length:', response.data.length);

          // Try multiple selectors for job listings
          const selectors = [
            '.jobs-list .job-item',
            '.job-listing',
            '.job-card',
            'article',
            '[data-job-id]',
            '.job'
          ];

          for (const selector of selectors) {
            const elements = $(selector);
            console.log(`Found ${elements.length} elements with selector "${selector}"`);

            if (elements.length > 0) {
              elements.each((_, element) => {
                try {
                  const $el = $(element);
                  console.log('\nFound job listing:', $el.text().substring(0, 100));

                  const jobId = $el.attr('data-job-id') || `HC${Math.floor(100000 + Math.random() * 900000)}`;

                  const job: InsertJob = {
                    jobIdentifier: jobId,
                    title: $el.find('.title, h2, h3').first().text().trim(),
                    company: $el.find('.company, .employer').first().text().trim(),
                    location: $el.find('.location').first().text().trim() || 'Remote',
                    salary: $el.find('.salary').first().text().trim() || 'Competitive',
                    description: $el.find('.description, .summary').first().text().trim() 
                      || $el.text().trim(),
                    requirements: $el.find('.requirements').first().text().trim() 
                      || 'See job description',
                    source: 'hiring.cafe',
                    sourceUrl: new URL($el.find('a').attr('href') || '', url).toString(),
                    type: 'STEM',
                    published: true
                  };

                  if (this.validateJob(job)) {
                    console.log('Valid job found:', {
                      title: job.title,
                      company: job.company,
                      jobIdentifier: job.jobIdentifier
                    });
                    jobs.push(job);
                  }
                } catch (error) {
                  console.error('Error parsing job element:', error);
                }
              });
            }
          }
        }

      } catch (error: any) {
        console.error('Error accessing hiring.cafe:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          url: error.config?.url
        });
      }

    } catch (error) {
      console.error('Error in hiring.cafe scraper:', error);
    }

    console.log(`Found total of ${jobs.length} jobs from hiring.cafe`);
    return jobs;
  }
}