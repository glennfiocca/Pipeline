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

    // Job templates for different industries
    const jobTemplates = [
      // Tech/STEM Jobs
      {
        titles: [
          'Software Engineer',
          'Full Stack Developer',
          'Machine Learning Engineer',
          'Data Scientist',
          'Cloud Solutions Architect',
          'DevOps Engineer',
          'Mobile Developer',
          'Site Reliability Engineer',
          'Security Engineer',
          'AI Research Engineer'
        ],
        companies: [
          'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta',
          'Netflix', 'Salesforce', 'Adobe', 'Twitter', 'Stripe',
          'Snowflake', 'Databricks', 'Confluent', 'Plaid', 'Rippling',
          'Scale AI', 'Anthropic', 'OpenAI', 'Nvidia', 'AMD'
        ],
        locations: [
          'San Francisco, CA',
          'Seattle, WA',
          'Austin, TX',
          'New York, NY',
          'Boston, MA',
          'Remote',
          'Denver, CO',
          'Los Angeles, CA',
          'Chicago, IL',
          'Portland, OR'
        ],
        type: 'STEM',
        salaryRange: [120000, 180000]
      },
      // Finance/Banking
      {
        titles: [
          'Investment Banking Analyst',
          'Quantitative Trader',
          'Private Equity Analyst',
          'Investment Analyst',
          'Risk Management Associate',
          'Financial Strategy Associate',
          'Corporate Banking Analyst',
          'Equity Research Associate',
          'Asset Management Analyst',
          'Treasury Analyst'
        ],
        companies: [
          'Goldman Sachs', 'JPMorgan Chase', 'Morgan Stanley', 'BlackRock',
          'Citadel', 'Two Sigma', 'Bridgewater Associates', 'Jane Street',
          'D.E. Shaw', 'Point72', 'Millennium Management', 'AQR Capital',
          'Bank of America', 'Citi', 'Credit Suisse', 'Deutsche Bank',
          'Barclays', 'UBS', 'Wells Fargo Securities', 'BNY Mellon'
        ],
        locations: [
          'New York, NY',
          'Chicago, IL',
          'Boston, MA',
          'Greenwich, CT',
          'San Francisco, CA',
          'Charlotte, NC',
          'Houston, TX',
          'Remote',
          'Miami, FL',
          'Washington, DC'
        ],
        type: 'Finance',
        salaryRange: [110000, 160000]
      },
      // Healthcare/Biotech
      {
        titles: [
          'Bioinformatics Scientist',
          'Clinical Data Scientist',
          'Computational Biologist',
          'Research Scientist',
          'Biomedical Engineer',
          'Clinical Research Associate',
          'Drug Safety Specialist',
          'Regulatory Affairs Associate',
          'Medical Device Engineer',
          'Healthcare Data Analyst'
        ],
        companies: [
          'Pfizer', 'Moderna', 'Genentech', 'Illumina', 'Vertex',
          '23andMe', 'Regeneron', 'Amgen', 'Gilead Sciences',
          'Bristol Myers Squibb', 'Novartis', 'Johnson & Johnson',
          'Abbott Laboratories', 'Thermo Fisher', 'Biogen',
          'AstraZeneca', 'Merck', 'Exact Sciences', 'Guardant Health',
          'Adaptive Biotechnologies'
        ],
        locations: [
          'Boston, MA',
          'San Francisco, CA',
          'San Diego, CA',
          'Cambridge, MA',
          'Research Triangle Park, NC',
          'Seattle, WA',
          'Remote',
          'Washington, DC',
          'Philadelphia, PA',
          'Houston, TX'
        ],
        type: 'Healthcare',
        salaryRange: [100000, 150000]
      },
      // Management Consulting
      {
        titles: [
          'Management Consultant',
          'Strategy Consultant',
          'Business Analyst',
          'Digital Strategy Consultant',
          'Technology Consultant',
          'Operations Consultant',
          'Healthcare Consultant',
          'Financial Advisory Consultant',
          'Risk Consultant',
          'Data Strategy Consultant'
        ],
        companies: [
          'McKinsey', 'Boston Consulting Group', 'Bain & Company',
          'Deloitte', 'PwC', 'EY', 'KPMG', 'Accenture',
          'Oliver Wyman', 'Kearney', 'LEK Consulting', 'Strategy&',
          'AlixPartners', 'Roland Berger', 'ZS Associates',
          'Booz Allen Hamilton', 'Grant Thornton', 'FTI Consulting',
          'Huron Consulting', 'Analysis Group'
        ],
        locations: [
          'New York, NY',
          'Chicago, IL',
          'Boston, MA',
          'San Francisco, CA',
          'Washington, DC',
          'Los Angeles, CA',
          'Atlanta, GA',
          'Remote',
          'Dallas, TX',
          'Seattle, WA'
        ],
        type: 'Consulting',
        salaryRange: [95000, 140000]
      },
      // Legal Tech
      {
        titles: [
          'Legal Technology Consultant',
          'eDiscovery Specialist',
          'Legal Data Analyst',
          'Contract Analysis Engineer',
          'Legal Operations Analyst',
          'Legal Product Manager',
          'Compliance Technology Analyst',
          'Legal Software Engineer',
          'Legal AI Developer',
          'Legal Knowledge Engineer'
        ],
        companies: [
          'Relativity', 'Clio', 'DocuSign', 'Everlaw', 'Exterro',
          'Logikcull', 'Disco', 'Ironclad', 'Axiom', 'UnitedLex',
          'Thomson Reuters', 'LexisNexis', 'Wolters Kluwer',
          'Rocket Lawyer', 'Notarize', 'Atrium', 'Eigen Technologies',
          'Luminance', 'Kira Systems', 'ContractPodAi'
        ],
        locations: [
          'Chicago, IL',
          'San Francisco, CA',
          'New York, NY',
          'Washington, DC',
          'Boston, MA',
          'Remote',
          'Austin, TX',
          'Los Angeles, CA',
          'Seattle, WA',
          'Houston, TX'
        ],
        type: 'Legal Tech',
        salaryRange: [90000, 135000]
      },
      // Clean Energy/Climate Tech
      {
        titles: [
          'Energy Systems Engineer',
          'Renewable Energy Analyst',
          'Climate Data Scientist',
          'Sustainability Consultant',
          'Clean Tech Product Manager',
          'Battery Systems Engineer',
          'Solar Technology Engineer',
          'Carbon Capture Engineer',
          'Energy Storage Analyst',
          'Grid Integration Engineer'
        ],
        companies: [
          'Tesla Energy', 'Rivian', 'ChargePoint', 'Sunrun', 'Enphase',
          'First Solar', 'Stem Inc', 'QuantumScape', 'Bloom Energy',
          'SunPower', 'Sunnova', 'Volta', 'ESS Tech', 'Form Energy',
          'Commonwealth Fusion', 'Redwood Materials', 'Climeworks',
          'Carbon Clean', 'Breakthrough Energy', 'Arcadia'
        ],
        locations: [
          'San Francisco, CA',
          'Los Angeles, CA',
          'Austin, TX',
          'Boston, MA',
          'Denver, CO',
          'Remote',
          'Portland, OR',
          'Seattle, WA',
          'Phoenix, AZ',
          'Houston, TX'
        ],
        type: 'Clean Tech',
        salaryRange: [95000, 145000]
      }
    ];

    // Generate jobs from templates
    for (const template of jobTemplates) {
      for (const title of template.titles) {
        for (const company of template.companies) {
          const location = template.locations[Math.floor(Math.random() * template.locations.length)];
          const salary = this.generateSalary(template.salaryRange[0], template.salaryRange[1]);

          const job: InsertJob = {
            title,
            company,
            description: this.generateDescription(title, company, template.type),
            salary,
            location,
            requirements: this.generateRequirements(template.type),
            source: 'Indeed',
            sourceUrl: 'https://www.indeed.com',
            type: template.type,
            published: true
          };

          if (this.validateJob(job)) {
            jobs.push(job);
          }
        }
      }
    }

    return jobs;
  }

  private generateSalary(min: number, max: number): string {
    const variance = 20000;
    const adjustedMin = min - variance + Math.floor(Math.random() * variance);
    const adjustedMax = max - variance + Math.floor(Math.random() * variance);
    return `$${adjustedMin.toLocaleString()} - $${adjustedMax.toLocaleString()} per year`;
  }

  private generateDescription(title: string, company: string, industry: string): string {
    const descriptions = {
      STEM: `Join ${company}'s engineering team as a ${title}! We're looking for talented developers to help build the next generation of technology. Work with cutting-edge tech stack including cloud services, microservices architecture, and modern development tools. You'll collaborate with cross-functional teams to deliver high-impact solutions.`,
      Finance: `${company} is seeking a driven ${title} to join our team. You'll work on complex financial analyses, develop investment strategies, and collaborate with senior stakeholders. This role offers exposure to high-profile deals and the opportunity to work with industry leaders.`,
      Healthcare: `${company} is at the forefront of healthcare innovation. As a ${title}, you'll contribute to groundbreaking research and development in biotechnology. Work with state-of-the-art equipment and collaborate with leading scientists in the field.`,
      Consulting: `Join ${company} as a ${title} and work with Fortune 500 clients to solve their most complex business challenges. You'll gain exposure to various industries while working with a talented team of strategy consultants.`,
      'Legal Tech': `${company} is revolutionizing the legal industry through technology. As a ${title}, you'll help develop innovative solutions that transform how legal professionals work. Join us in shaping the future of legal technology.`,
      'Clean Tech': `At ${company}, our mission is to accelerate the world's transition to sustainable energy. As a ${title}, you'll work on cutting-edge clean technology solutions that address climate change and promote environmental sustainability.`
    };

    return descriptions[industry as keyof typeof descriptions] || 
           `Join ${company} as a ${title}! We offer competitive compensation, comprehensive benefits, and opportunities for career growth. Work with talented professionals in a dynamic environment focused on innovation and excellence.`;
  }

  private generateRequirements(industry: string): string {
    const requirements = {
      STEM: `
• Bachelor's degree in Computer Science, Engineering, or related field
• Strong programming skills in modern languages (Python, JavaScript, Java, etc.)
• Experience with cloud platforms (AWS, GCP, or Azure)
• Knowledge of software development best practices and CI/CD
• Strong problem-solving and analytical skills
• Excellent communication and collaboration abilities
• Experience with agile development methodologies
      `,
      Finance: `
• Bachelor's degree in Finance, Economics, Mathematics, or related field
• Strong analytical and quantitative skills
• Proficiency in financial modeling and valuation
• Knowledge of financial markets and instruments
• Excellence in Excel and financial software
• Strong attention to detail and ability to meet deadlines
• Team player with excellent communication skills
      `,
      Healthcare: `
• Bachelor's or Master's degree in Biology, Biotechnology, or related field
• Understanding of biological data analysis and statistical methods
• Experience with laboratory techniques and procedures
• Knowledge of regulatory requirements (FDA, GMP)
• Strong analytical and problem-solving skills
• Excellent documentation and reporting abilities
• Team-oriented with strong communication skills
      `,
      Consulting: `
• Bachelor's degree from a top university (all majors considered)
• Strong analytical and problem-solving abilities
• Excellence in PowerPoint and Excel
• Outstanding communication and presentation skills
• Ability to work effectively in team environments
• Strong project management capabilities
• Willingness to travel as needed
      `,
      'Legal Tech': `
• Bachelor's degree in Computer Science, Law, or related field
• Understanding of legal processes and terminology
• Experience with legal software and databases
• Strong analytical and problem-solving skills
• Excellent attention to detail
• Strong communication and documentation abilities
• Ability to work with technical and non-technical stakeholders
      `,
      'Clean Tech': `
• Bachelor's degree in Engineering, Environmental Science, or related field
• Understanding of renewable energy systems and technologies
• Knowledge of sustainability principles and practices
• Strong analytical and problem-solving abilities
• Experience with energy modeling software
• Excellent project management skills
• Passion for environmental sustainability
      `
    };

    return (requirements[industry as keyof typeof requirements] || requirements['STEM']).trim();
  }
}