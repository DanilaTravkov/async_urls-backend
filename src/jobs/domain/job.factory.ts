import { randomUUID } from 'node:crypto';
import { JobStatus } from './job-status.enum';
import { Job } from './job.types';
import { UrlCheckStatus } from './url-check-status.enum';

export interface JobFactoryOptions {
  createId?: () => string;
  now?: () => Date;
}

export function createJob(
  urls: readonly string[],
  options: JobFactoryOptions = {},
): Job {
  const createId = options.createId ?? randomUUID;
  const now = options.now ?? (() => new Date());

  return {
    id: createId(),
    createdAt: now(),
    status: JobStatus.Pending,
    items: urls.map((url) => ({
      id: createId(),
      url,
      status: UrlCheckStatus.Pending,
      httpStatus: null,
      error: null,
      startedAt: null,
      finishedAt: null,
      durationMs: null,
    })),
  };
}
