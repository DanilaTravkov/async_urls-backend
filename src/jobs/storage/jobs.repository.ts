import { Job } from '../domain/job.types';

export class FindJobsPageOptions {
  constructor(
    public limit: number,
    public cursor?: string,
  ) {}
}

export class JobsPage {
  constructor(
    public items: Job[],
    public nextCursor: string | null,
  ) {}
}

export abstract class JobsRepository {
  abstract save(job: Job): Promise<void>;
  abstract findById(id: string): Promise<Job | null>;
  abstract findPage(options: FindJobsPageOptions): Promise<JobsPage>;
}
