import axios from 'axios';
import robotsParser from 'robots-parser';
import PQueue from 'p-queue';
import type { Job, InsertJob } from '@shared/schema';

export abstract class BaseScraper {
  protected queue: PQueue;
  protected robots: any = null;

  constructor(
    protected baseUrl: string,
    protected concurrency: number = 1
  ) {
    this.queue = new PQueue({ concurrency });
  }

  protected async init() {
    try {
      // Fetch and parse robots.txt
      const robotsUrl = new URL('/robots.txt', this.baseUrl).toString();
      const response = await axios.get(robotsUrl);
      this.robots = robotsParser(robotsUrl, response.data);
    } catch (error) {
      console.warn(`Could not fetch robots.txt for ${this.baseUrl}:`, error);
    }
  }

  protected isAllowed(url: string): boolean {
    if (!this.robots) return true;
    return this.robots.isAllowed(url, 'PipelineBot');
  }

  protected validateJob(job: Partial<InsertJob>): job is InsertJob {
    return !!(
      job.title &&
      job.company &&
      job.description &&
      job.salary &&
      job.location &&
      job.requirements &&
      job.source &&
      job.sourceUrl &&
      job.type
    );
  }

  abstract scrape(): Promise<InsertJob[]>;
}