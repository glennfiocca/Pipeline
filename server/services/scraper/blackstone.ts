import axios from 'axios';
import { BaseScraper } from './base';
import type { InsertJob } from '@shared/schema';

export class BlackstoneScraper extends BaseScraper {
  constructor() {
    super('https://blackstone.wd1.myworkdayjobs.com/Blackstone', 1);
  }

  async scrape(): Promise<InsertJob[]> {
    const jobs: InsertJob[] = [];

    try {
      console.log('Starting Blackstone careers API scraper...');

      const headers = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };

      // Workday job search API endpoint
      const response = await axios.get(
        'https://blackstone.wd1.myworkdayjobs.com/wday/cxs/blackstone/Blackstone/jobs',
        {
          headers,
          params: {
            limit: 20,
            offset: 0,
            sortBy: 'POSTING_DATE_DESC'
          }
        }
      );

      if (response.data && Array.isArray(response.data.jobPostings)) {
        console.log(`Found ${response.data.jobPostings.length} job postings`);

        for (const posting of response.data.jobPostings) {
          const job: InsertJob = {
            title: posting.title,
            company: 'Blackstone',
            location: posting.locationsText || 'Multiple Locations',
            salary: posting.compensation || 'Competitive',
            description: posting.description || 'Please see full job description on Blackstone careers',
            requirements: posting.jobRequirements || 'See full job posting for detailed requirements',
            source: 'Blackstone Careers',
            sourceUrl: `${this.baseUrl}/job/${posting.externalPath}`,
            type: posting.timeType || 'Full-time',
            published: true
          };

          if (this.validateJob(job)) {
            console.log('Found valid Blackstone job:', {
              title: job.title,
              location: job.location
            });
            jobs.push(job);
          }
        }
      }

    } catch (error: any) {
      console.error('Blackstone API error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }

    console.log(`Successfully retrieved ${jobs.length} Blackstone jobs`);
    return jobs;
  }
}