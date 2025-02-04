import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { InsertJob } from '@shared/schema';

export class IndeedScraper extends BaseScraper {
  constructor() {
    super('https://www.indeed.com', 2);
  }

  async scrape(): Promise<InsertJob[]> {
    const jobs: InsertJob[] = [];

    // Mock data for different job types
    const jobTemplates = [
      // STEM Jobs
      {
        titles: [
          'Software Engineer',
          'Senior Software Developer',
          'Full Stack Engineer',
          'Frontend Developer',
          'Backend Engineer',
          'Data Scientist',
          'Machine Learning Engineer',
          'DevOps Engineer',
          'Cloud Architect',
          'Systems Engineer'
        ],
        companies: [
          'Google',
          'Microsoft',
          'Amazon',
          'Meta',
          'Apple',
          'Netflix',
          'Tesla',
          'IBM',
          'Intel',
          'Oracle'
        ],
        locations: [
          'San Francisco, CA',
          'Seattle, WA',
          'New York, NY',
          'Austin, TX',
          'Remote'
        ],
        type: 'STEM'
      },
      // Finance Jobs
      {
        titles: [
          'Financial Analyst',
          'Investment Banking Associate',
          'Portfolio Manager',
          'Risk Analyst',
          'Quantitative Trader',
          'Financial Advisor',
          'Investment Associate',
          'Credit Analyst',
          'Hedge Fund Analyst',
          'Private Equity Associate'
        ],
        companies: [
          'Goldman Sachs',
          'JPMorgan Chase',
          'Morgan Stanley',
          'BlackRock',
          'Citigroup',
          'Bank of America',
          'Wells Fargo',
          'Vanguard',
          'Fidelity',
          'Charles Schwab'
        ],
        locations: [
          'New York, NY',
          'Chicago, IL',
          'Boston, MA',
          'Charlotte, NC',
          'Remote'
        ],
        type: 'Finance'
      }
    ];

    // Generate mock jobs
    for (const template of jobTemplates) {
      for (const title of template.titles) {
        for (const company of template.companies) {
          const location = template.locations[Math.floor(Math.random() * template.locations.length)];
          const salary = this.generateSalary(template.type);

          const job: InsertJob = {
            title,
            company,
            description: this.generateDescription(title, company),
            salary,
            location,
            requirements: this.generateRequirements(template.type),
            source: 'Indeed',
            sourceUrl: 'https://www.indeed.com',
            type: template.type,
            published: true
          };

          if (this.validateJob(job)) {
            console.log('Generated job:', {
              title: job.title,
              company: job.company,
              type: job.type
            });
            jobs.push(job);
          }
        }
      }
    }

    console.log(`Generated ${jobs.length} mock jobs`);
    return jobs;
  }

  private generateSalary(type: string): string {
    const base = type === 'STEM' ? 120000 : 100000;
    const variance = 40000;
    const min = base - variance;
    const max = base + variance;
    return `$${min.toLocaleString()} - $${max.toLocaleString()} per year`;
  }

  private generateDescription(title: string, company: string): string {
    return `Join ${company} as a ${title}! We're looking for talented professionals to help drive innovation and growth. This role offers competitive compensation, comprehensive benefits, and opportunities for career advancement. Work with cutting-edge technologies and collaborate with exceptional colleagues in a dynamic environment.`;
  }

  private generateRequirements(type: string): string {
    if (type === 'STEM') {
      return `
• Bachelor's degree in Computer Science or related field
• 3+ years of professional software development experience
• Strong programming skills in modern languages
• Experience with cloud platforms (AWS, GCP, or Azure)
• Excellent problem-solving and analytical skills
• Strong communication and collaboration abilities
• Agile/Scrum experience
      `.trim();
    } else {
      return `
• Bachelor's degree in Finance, Economics, or related field
• 3+ years of relevant financial analysis experience
• Strong analytical and quantitative skills
• Proficiency in financial modeling and valuation
• Knowledge of financial markets and instruments
• Excellence in Excel and financial software
• Strong communication and presentation skills
      `.trim();
    }
  }
}