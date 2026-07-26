import { Injectable } from '@nestjs/common';
import { JobStatus } from '../domain/job-status.enum';
import { Job, UrlCheck } from '../domain/job.types';
import { UrlCheckStatus } from '../domain/url-check-status.enum';
import { MAX_CONCURRENT_URL_CHECKS } from '../queue/jobs-queue.constants';
import { JobsRepository } from '../storage/jobs.repository';
import { HttpHeadClient } from './http-head-client';
import { ProcessingDelay } from './processing-delay';

@Injectable()
export class JobsProcessingService {
  constructor(
    private readonly jobsRepository: JobsRepository,
    private readonly httpHeadClient: HttpHeadClient,
    private readonly processingDelay: ProcessingDelay,
  ) {}

  async process(jobId: string): Promise<void> {
    const job = await this.jobsRepository.findById(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} was not found`);
    }

    job.status = JobStatus.InProgress;
    await this.jobsRepository.save(job);

    try {
      await this.processItems(job);
      job.status = JobStatus.Completed;
      await this.jobsRepository.save(job);
    } catch (error) {
      job.status = JobStatus.Failed;
      await this.jobsRepository.save(job);
      throw error;
    }
  }

  private async processItems(job: Job): Promise<void> {
    let nextItemIndex = 0;
    const workerCount = Math.min(MAX_CONCURRENT_URL_CHECKS, job.items.length);
    const workers = Array.from({ length: workerCount }, async () => {
      while (nextItemIndex < job.items.length) {
        const item = job.items[nextItemIndex];
        nextItemIndex += 1;
        await this.processItem(job, item);
      }
    });

    await Promise.all(workers);
  }

  private async processItem(job: Job, item: UrlCheck): Promise<void> {
    item.status = UrlCheckStatus.InProgress;
    item.startedAt = new Date();
    await this.jobsRepository.save(job);

    let resultStatus: UrlCheckStatus;
    let httpStatus: number | null = null;
    let errorMessage: string | null = null;

    try {
      httpStatus = await this.httpHeadClient.check(item.url);
      resultStatus = UrlCheckStatus.Success;
    } catch (error) {
      resultStatus = UrlCheckStatus.Error;
      errorMessage = getErrorMessage(error);
    }

    await this.processingDelay.wait();

    item.status = resultStatus;
    item.httpStatus = httpStatus;
    item.error = errorMessage;
    item.finishedAt = new Date();
    item.durationMs = item.finishedAt.getTime() - item.startedAt.getTime();
    await this.jobsRepository.save(job);
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown URL check error';
}
