import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { InsertJob } from '@shared/schema';

export class IndeedScraper extends BaseScraper {
  constructor() {
    super('https://www.indeed.com', 1);
  }

  async scrape(): Promise<InsertJob[]> {
    const jobs: InsertJob[] = [];
    let page = 0;
    const jobsPerPage = 10;

    try {
      // Common headers that work well with Indeed
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'TE': 'trailers'
      };

      while (jobs.length < 10) {
        const url = `${this.baseUrl}/jobs?q=Blackstone&l=United+States&start=${page * jobsPerPage}`;
        console.log(`Fetching page ${page + 1} from ${url}`);

        const response = await axios.get(url, { 
          headers,
          timeout: 30000,
          maxRedirects: 5,
          validateStatus: status => status === 200
        });

        const $ = cheerio.load(response.data);

        // Parse each job card
        $('.job_seen_beacon').each((_, element) => {
          const $job = $(element);

          // Only process if it's a Blackstone job
          const companyName = $job.find('[data-company-name]').text().trim();
          if (!companyName.toLowerCase().includes('blackstone')) return;

          const jobTitle = $job.find('.jobTitle').text().trim();
          const jobUrl = $job.find('.jcs-JobTitle').attr('href');
          const location = $job.find('.companyLocation').text().trim();

          // Get full job details
          const description = $job.find('.job-snippet').text().trim();
          const salary = $job.find('.salary-snippet').text().trim();

          const job: InsertJob = {
            title: jobTitle,
            company: companyName,
            location: location || 'United States',
            salary: salary || 'Competitive',
            description: description || 'Please see full job description on Indeed',
            requirements: 'Please see full job posting for detailed requirements',
            source: 'Indeed',
            sourceUrl: jobUrl ? new URL(jobUrl, this.baseUrl).toString() : url,
            type: 'Full-time',
            published: true
          };

          if (this.validateJob(job)) {
            console.log(`Found valid Blackstone job: ${job.title}`);
            jobs.push(job);
          }
        });

        // Break if no more jobs found on current page
        if (!$('.job_seen_beacon').length) break;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        page++;
      }

    } catch (error: any) {
      console.error('Indeed scraping error:', {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url
      });
    }

    console.log(`Successfully scraped ${jobs.length} Blackstone jobs`);
    return jobs;
  }
}