import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { InsertJob } from '@shared/schema';

export class IndeedScraper extends BaseScraper {
  constructor() {
    super('https://www.indeed.com', 2); // 2 concurrent requests
  }

  async scrape(): Promise<InsertJob[]> {
    const jobs: InsertJob[] = [];

    try {
      await this.init();
      console.log('Starting Indeed jobs scraper...');

      const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; PipelineBot/1.0; +https://pipeline.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      };

      // Define job categories to scrape
      const searches = [
        { query: 'software engineer', type: 'STEM' },
        { query: 'data scientist', type: 'STEM' },
        { query: 'financial analyst', type: 'Finance' },
        { query: 'investment banking', type: 'Finance' },
        { query: 'registered nurse', type: 'Healthcare' },
        { query: 'product manager', type: 'Business' }
      ];

      for (const search of searches) {
        try {
          // Format search URL with location set to United States
          const url = `${this.baseUrl}/jobs?q=${encodeURIComponent(search.query)}&l=United+States`;

          if (!this.isAllowed(url)) {
            console.log(`Skipping ${url} - not allowed by robots.txt`);
            continue;
          }

          console.log(`\nFetching jobs for: ${search.query}`);
          const response = await axios.get(url, { headers, timeout: 10000 });
          console.log(`Response status: ${response.status}`);
          const $ = cheerio.load(response.data);
          console.log(`Page content loaded, parsing jobs...`);

          // Try different selectors that Indeed might use
          const jobSelectors = [
            '.job_seen_beacon',
            '.jobsearch-ResultsList .result',
            '.mosaic-provider-jobcards .job-card'
          ];

          let foundJobs = 0;
          for (const selector of jobSelectors) {
            console.log(`Trying selector: ${selector}`);
            $(selector).each((_, element) => {
              try {
                const $job = $(element);

                // Log the raw HTML for debugging
                console.log(`Found job element: ${$job.html()?.substring(0, 100)}...`);

                // Extract job details with multiple possible selectors
                const title = $job.find('.jobTitle span, .title, h2.title').first().text().trim();
                const company = $job.find('.companyName, .company, .company-name').first().text().trim();
                const location = $job.find('.companyLocation, .location').first().text().trim();
                const salary = $job.find('.salary-snippet, .salaryText').first().text().trim() || 'Competitive';
                const description = $job.find('.job-snippet, .summary').first().text().trim();

                console.log(`Extracted job: ${title} at ${company}`);

                const job: InsertJob = {
                  title,
                  company,
                  location: location || 'United States',
                  salary,
                  description: description || 'See full listing on Indeed',
                  requirements: 'See full job posting on Indeed',
                  source: 'Indeed',
                  sourceUrl: url,
                  type: search.type,
                  published: true
                };

                if (this.validateJob(job)) {
                  console.log('Valid job found:', {
                    title: job.title,
                    company: job.company,
                    type: job.type
                  });
                  jobs.push(job);
                  foundJobs++;
                }
              } catch (error) {
                console.error('Error parsing Indeed job card:', error);
              }
            });

            if (foundJobs > 0) {
              console.log(`Found ${foundJobs} jobs with selector ${selector}`);
              break; // Found working selector, no need to try others
            }
          }

          // Add a small delay between requests to be respectful
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
          console.error('Error fetching Indeed jobs:', {
            query: search.query,
            status: error.response?.status,
            message: error.message
          });
        }
      }

    } catch (error) {
      console.error('Error in Indeed scraper:', error);
    }

    console.log(`Found total of ${jobs.length} jobs from Indeed`);
    return jobs;
  }
}