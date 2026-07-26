import { Job } from '../domain/job.types';

export const JOBS_REPOSITORY = Symbol('JOBS_REPOSITORY');

export interface FindJobsPageOptions {
  limit: number;
  cursor?: string;
}

export interface JobsPage {
  items: Job[];
  nextCursor: string | null;
}

export interface JobsRepository {
  save(job: Job): Promise<void>;
  findById(id: string): Promise<Job | null>;
  findPage(options: FindJobsPageOptions): Promise<JobsPage>;
}
