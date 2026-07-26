import { Injectable } from '@nestjs/common';
import { cloneJob } from '../domain/job.factory';
import { Job } from '../domain/job.types';
import { decodeJobsCursor, encodeJobsCursor } from './jobs-cursor';
import {
  FindJobsPageOptions,
  JobsPage,
  JobsRepository,
} from './jobs.repository';
import { InvalidJobsCursorError } from './invalid-jobs-cursor.error';

@Injectable()
export class InMemoryJobsRepository extends JobsRepository {
  private readonly jobs = new Map<string, Job>();

  save(job: Job): Promise<void> {
    this.jobs.set(job.id, cloneJob(job));
    return Promise.resolve();
  }

  findById(id: string): Promise<Job | null> {
    const job = this.jobs.get(id);
    return Promise.resolve(job ? cloneJob(job) : null);
  }

  findPage(options: FindJobsPageOptions): Promise<JobsPage> {
    if (!Number.isInteger(options.limit) || options.limit < 1) {
      throw new RangeError('Page limit must be a positive integer');
    }

    const jobs = [...this.jobs.values()].sort(compareJobsNewestFirst);
    const startIndex = options.cursor
      ? this.findStartIndex(jobs, options.cursor)
      : 0;
    const page = jobs.slice(startIndex, startIndex + options.limit + 1);
    const hasNextPage = page.length > options.limit;
    const items = page.slice(0, options.limit);
    const nextCursor =
      hasNextPage && items.length > 0
        ? encodeJobsCursor(items[items.length - 1])
        : null;

    return Promise.resolve(
      new JobsPage(
        items.map((job) => cloneJob(job)),
        nextCursor,
      ),
    );
  }

  private findStartIndex(jobs: readonly Job[], cursor: string): number {
    const decodedCursor = decodeJobsCursor(cursor);
    const cursorIndex = jobs.findIndex(
      (job) =>
        job.id === decodedCursor.id &&
        job.createdAt.toISOString() === decodedCursor.createdAt,
    );

    if (cursorIndex === -1) {
      throw new InvalidJobsCursorError();
    }

    return cursorIndex + 1;
  }
}

function compareJobsNewestFirst(left: Job, right: Job): number {
  const dateDifference = right.createdAt.getTime() - left.createdAt.getTime();
  return dateDifference !== 0
    ? dateDifference
    : right.id.localeCompare(left.id);
}
