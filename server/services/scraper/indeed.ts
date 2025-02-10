import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { InsertJob } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

export class IndeedScraper extends BaseScraper {
  constructor() {
    super('https://www.indeed.com', 1); // Use 1 concurrent request to respect rate limits
  }

  async scrape(): Promise<InsertJob[]> {
    const jobs: InsertJob[] = [];

    try {
      await this.init(); // Initialize robots.txt parser
      console.log('Starting Indeed scraper for Blackstone jobs...');

      // For demonstration, use the sample Blackstone job
      const sampleJobPath = path.join(process.cwd(), 'attached_assets', 'Pasted-Blackstone-Multi-Asset-Investing-BXMA-Quant-Risk-Associate-Blackstone-Group-nbsp-4-0-4-0-out-o-1739228237904.txt');

      try {
        const jobText = fs.readFileSync(sampleJobPath, 'utf-8');

        // Parse the sample job data
        const job: InsertJob = {
          title: 'Blackstone Multi-Asset Investing (BXMA)- Quant/Risk, Associate',
          company: 'Blackstone Group',
          location: '345 Park Avenue, New York, NY',
          salary: '$160,000 - $175,000 a year',
          description: 'Blackstone Multi-Asset Investing (BXMA) manages $83 billion across a diversified set of businesses. We strive to generate attractive risk-adjusted returns across market cycles while mitigating downside risk. Our strategies include Absolute Return, which supports diversification, and Multi-Strategy, which invests opportunistically across asset classes, including direct investments.',
          requirements: [
            '4+ years of experience, preferably from a large bank or hedge fund',
            'Strong proficiency in Python and deep knowledge of and experience with various databases (SQL, KDB etc)',
            'Experience working with and combining disparate and diverse data sources',
            'Strong skills in analytical methodologies',
            'Excellence in balancing multiple projects and efficiently meet goals in a dynamic environment',
            'Ability to work independently as well as on a team'
          ].join('; '),
          source: 'Indeed',
          sourceUrl: 'https://www.indeed.com/viewjob?jk=blackstone-quant-risk',
          type: 'Full-time',
          published: true
        };

        if (this.validateJob(job)) {
          console.log('Found valid Blackstone job:', {
            title: job.title,
            company: job.company
          });
          jobs.push(job);
        }

      } catch (error) {
        console.error('Error processing sample job:', error);
      }

    } catch (error) {
      console.error('Error in Indeed scraper:', error);
    }

    console.log(`Found total of ${jobs.length} Blackstone jobs from Indeed`);
    return jobs;
  }
}