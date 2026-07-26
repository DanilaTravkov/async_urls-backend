import { Injectable } from '@nestjs/common';
import { JobStatus } from '../domain/job-status.enum';
import { UrlCheck } from '../domain/job.types';
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
    const job = await this.jobsRepository.update(jobId, (storedJob) => {
      if (storedJob.status !== JobStatus.Cancelled) {
        storedJob.status = JobStatus.InProgress;
      }
    });

    if (!job) {
      throw new Error(`Job ${jobId} was not found`);
    }

    if (job.status === JobStatus.Cancelled) {
      return;
    }

    try {
      await this.processItems(jobId);
      await this.jobsRepository.update(jobId, (storedJob) => {
        if (storedJob.status !== JobStatus.Cancelled) {
          storedJob.status = JobStatus.Completed;
        }
      });
    } catch (error) {
      await this.jobsRepository.update(jobId, (storedJob) => {
        if (storedJob.status !== JobStatus.Cancelled) {
          storedJob.status = JobStatus.Failed;
        }
      });
      throw error;
    }
  }

  private async processItems(jobId: string): Promise<void> {
    const workers = Array.from(
      { length: MAX_CONCURRENT_URL_CHECKS },
      async () => {
        let item = await this.claimNextItem(jobId);
        while (item) {
          await this.processItem(jobId, item);
          item = await this.claimNextItem(jobId);
        }
      },
    );

    await Promise.all(workers);
  }

  private async claimNextItem(jobId: string): Promise<UrlCheck | null> {
    let claimedItemId: string | null = null;
    const job = await this.jobsRepository.update(jobId, (storedJob) => {
      if (storedJob.status === JobStatus.Cancelled) {
        return;
      }

      const item = storedJob.items.find(
        (candidate) => candidate.status === UrlCheckStatus.Pending,
      );
      if (!item) {
        return;
      }

      item.status = UrlCheckStatus.InProgress;
      item.startedAt = new Date();
      claimedItemId = item.id;
    });

    if (!job || !claimedItemId) {
      return null;
    }

    return job.items.find((item) => item.id === claimedItemId) ?? null;
  }

  private async processItem(jobId: string, item: UrlCheck): Promise<void> {
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

    const finishedAt = new Date();
    await this.jobsRepository.update(jobId, (storedJob) => {
      const storedItem = storedJob.items.find(
        (candidate) => candidate.id === item.id,
      );
      if (!storedItem || !storedItem.startedAt) {
        throw new Error(`URL check ${item.id} was not found`);
      }

      storedItem.status = resultStatus;
      storedItem.httpStatus = httpStatus;
      storedItem.error = errorMessage;
      storedItem.finishedAt = finishedAt;
      storedItem.durationMs =
        finishedAt.getTime() - storedItem.startedAt.getTime();
    });
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown URL check error';
}
