import { JobStatus } from './job-status.enum';
import { UrlCheckStatus } from './url-check-status.enum';

export interface UrlCheck {
  id: string;
  url: string;
  status: UrlCheckStatus;
  httpStatus: number | null;
  error: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  durationMs: number | null;
}

export interface Job {
  id: string;
  createdAt: Date;
  status: JobStatus;
  items: UrlCheck[];
}

export interface JobStatistics {
  pending: number;
  inProgress: number;
  success: number;
  error: number;
  cancelled: number;
}
