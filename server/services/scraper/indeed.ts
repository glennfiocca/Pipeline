import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { InsertJob } from '@shared/schema';

export class IndeedScraper extends BaseScraper {
  constructor() {
    super('https://www.indeed.com', 1); // Use 1 concurrent request to respect rate limits
  }

  async scrape(): Promise<string[]> {  // Changed return type to string[] for raw HTML
    const rawJobPostings: string[] = [];

    try {
      await this.init(); // Initialize robots.txt parser
      console.log('Starting Indeed scraper...');

      // Configure headers to identify our bot properly
      const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; PipelineBot/1.0; +https://pipeline.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      };

      // Search parameters
      const searchQueries = [
        'software engineer',
        'data scientist',
        'machine learning engineer',
        'frontend developer',
        'backend developer',
        'full stack developer'
      ];

      const locations = [
        'Remote',
        'New York, NY',
        'San Francisco, CA',
        'Seattle, WA',
        'Austin, TX'
      ];

      for (const query of searchQueries) {
        for (const location of locations) {
          const encodedQuery = encodeURIComponent(query);
          const encodedLocation = encodeURIComponent(location);
          const url = `${this.baseUrl}/jobs?q=${encodedQuery}&l=${encodedLocation}`;

          if (!this.isAllowed(url)) {
            console.log(`Skipping ${url} - not allowed by robots.txt`);
            continue;
          }

          try {
            console.log(`Fetching jobs for ${query} in ${location}`);
            const response = await axios.get(url, { headers });
            const $ = cheerio.load(response.data);

            // Extract each job posting's HTML
            $('.job_seen_beacon').each((_, element) => {
              try {
                // Get the full HTML content of each job posting
                const jobHtml = $(element).html();
                if (jobHtml) {
                  // Add some context to help GPT understand the structure
                  const jobContext = `
                    Job Title: ${$(element).find('.jobTitle').text().trim()}
                    Company: ${$(element).find('.companyName').text().trim()}
                    Location: ${$(element).find('.companyLocation').text().trim()}

                    Full Job Posting HTML:
                    ${jobHtml}
                  `;

                  rawJobPostings.push(jobContext);
                  console.log('Found job posting:', $(element).find('.jobTitle').text().trim());
                }
              } catch (error) {
                console.error('Error extracting job HTML:', error);
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

    console.log(`Found total of ${rawJobPostings.length} raw job postings from Indeed`);
    return rawJobPostings;
  }
}