import { randomUUID } from 'node:crypto';
import { JobStatus } from './job-status.enum';
import { Job, UrlCheck } from './job.types';
import { UrlCheckStatus } from './url-check-status.enum';

export class JobFactoryOptions {
  constructor(
    public createId: () => string = randomUUID,
    public now: () => Date = () => new Date(),
  ) {}
}

export function createJob(
  urls: readonly string[],
  options: JobFactoryOptions = new JobFactoryOptions(),
): Job {
  return new Job(
    options.createId(),
    options.now(),
    JobStatus.Pending,
    urls.map(
      (url) =>
        new UrlCheck(
          options.createId(),
          url,
          UrlCheckStatus.Pending,
          null,
          null,
          null,
          null,
          null,
        ),
    ),
  );
}

export function cloneJob(job: Job): Job {
  return new Job(
    job.id,
    new Date(job.createdAt),
    job.status,
    job.items.map(
      (item) =>
        new UrlCheck(
          item.id,
          item.url,
          item.status,
          item.httpStatus,
          item.error,
          item.startedAt ? new Date(item.startedAt) : null,
          item.finishedAt ? new Date(item.finishedAt) : null,
          item.durationMs,
        ),
    ),
  );
}
