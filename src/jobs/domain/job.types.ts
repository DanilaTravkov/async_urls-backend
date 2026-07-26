import { JobStatus } from './job-status.enum';
import { UrlCheckStatus } from './url-check-status.enum';

export class UrlCheck {
  constructor(
    public id: string,
    public url: string,
    public status: UrlCheckStatus,
    public httpStatus: number | null,
    public error: string | null,
    public startedAt: Date | null,
    public finishedAt: Date | null,
    public durationMs: number | null,
  ) {}
}

export class Job {
  constructor(
    public id: string,
    public createdAt: Date,
    public status: JobStatus,
    public items: UrlCheck[],
  ) {}
}

export class JobStatistics {
  pending = 0;
  inProgress = 0;
  success = 0;
  error = 0;
  cancelled = 0;
}
