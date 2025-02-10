import axios from 'axios';
import { BaseScraper } from './base';
import type { InsertJob } from '@shared/schema';

export class BlackstoneScraper extends BaseScraper {
  constructor() {
    super('https://careers.blackstone.com', 1);
  }

  async scrape(): Promise<InsertJob[]> {
    const jobs: InsertJob[] = [];

    try {
      console.log('Starting Blackstone careers GraphQL scraper...');

      // GraphQL endpoint for Workday
      const GRAPHQL_URL = 'https://careers.blackstone.com/api/graphql';

      const query = `
        query Jobs {
          jobs(first: 100) {
            nodes {
              id
              title
              locationName
              departments {
                nodes {
                  name
                }
              }
              descriptionContent
              requirements
              compensationRange {
                min
                max
                currency
              }
              applicationUrl
            }
          }
        }
      `;

      const response = await axios.post(GRAPHQL_URL, {
        query,
        variables: {}
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data?.data?.jobs?.nodes) {
        const jobNodes = response.data.data.jobs.nodes;
        console.log(`Found ${jobNodes.length} job postings`);

        for (const node of jobNodes) {
          const department = node.departments?.nodes?.[0]?.name || 'General';
          const compensation = node.compensationRange ? 
            `${node.compensationRange.currency}${node.compensationRange.min}-${node.compensationRange.max}` :
            'Competitive';

          const job: InsertJob = {
            title: node.title,
            company: 'Blackstone',
            location: node.locationName || 'Multiple Locations',
            salary: compensation,
            description: node.descriptionContent || 'Please see full job description on Blackstone careers',
            requirements: node.requirements || 'See full job posting for detailed requirements',
            source: `Blackstone Careers - ${department}`,
            sourceUrl: node.applicationUrl || 'https://careers.blackstone.com',
            type: 'Full-time',
            published: true
          };

          if (this.validateJob(job)) {
            console.log('Found valid Blackstone job:', {
              title: job.title,
              department,
              location: job.location
            });
            jobs.push(job);
          }
        }
      }

    } catch (error: any) {
      // If GraphQL fails, try their REST API endpoint
      try {
        console.log('GraphQL failed, attempting REST API...');
        const REST_URL = 'https://careers.blackstone.com/api/jobs';

        const response = await axios.get(REST_URL, {
          headers: {
            'Accept': 'application/json'
          },
          params: {
            page: 1,
            per_page: 100
          }
        });

        if (Array.isArray(response.data)) {
          for (const posting of response.data) {
            const job: InsertJob = {
              title: posting.title,
              company: 'Blackstone',
              location: posting.location || 'Multiple Locations',
              salary: posting.compensation || 'Competitive',
              description: posting.description || 'Please see full job description on Blackstone careers',
              requirements: posting.requirements || 'See full job posting for detailed requirements',
              source: 'Blackstone Careers',
              sourceUrl: posting.url || 'https://careers.blackstone.com',
              type: posting.type || 'Full-time',
              published: true
            };

            if (this.validateJob(job)) {
              console.log('Found valid Blackstone job from REST API:', {
                title: job.title,
                location: job.location
              });
              jobs.push(job);
            }
          }
        }
      } catch (restError: any) {
        // If both APIs fail, try their Workday API directly
        try {
          console.log('REST API failed, attempting Workday API...');
          const WORKDAY_URL = 'https://blackstone.wd1.myworkdayjobs.com/wday/cxs/blackstone/Blackstone/jobs';

          const workdayResponse = await axios.get(WORKDAY_URL, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (workdayResponse.data?.jobPostings) {
            for (const posting of workdayResponse.data.jobPostings) {
              const job: InsertJob = {
                title: posting.title,
                company: 'Blackstone',
                location: posting.locationName || 'Multiple Locations',
                salary: 'Competitive',
                description: posting.jobDescription || 'Please see full job description',
                requirements: posting.jobRequirements || 'See full job posting for requirements',
                source: 'Blackstone Careers',
                sourceUrl: `https://blackstone.wd1.myworkdayjobs.com/Blackstone/job/${posting.externalPath}`,
                type: 'Full-time',
                published: true
              };

              if (this.validateJob(job)) {
                console.log('Found valid Blackstone job from Workday:', {
                  title: job.title,
                  location: job.location
                });
                jobs.push(job);
              }
            }
          }
        } catch (workdayError: any) {
          console.error('All API attempts failed:', {
            graphqlError: error.message,
            restError: restError.message,
            workdayError: workdayError.message
          });
          throw new Error('Failed to fetch jobs from any available API endpoint');
        }
      }
    }

    console.log(`Successfully retrieved ${jobs.length} Blackstone jobs`);
    return jobs;
  }
}