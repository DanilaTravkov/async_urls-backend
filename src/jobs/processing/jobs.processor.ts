import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job as BullJob } from 'bullmq';
import { JobQueuePayload } from '../queue/job-queue-payload';
import {
  JOBS_QUEUE_NAME,
  PROCESS_JOB_TASK,
} from '../queue/jobs-queue.constants';
import { JobsProcessingService } from './jobs-processing.service';

const DEFAULT_CONCURRENT_JOBS = 4;

@Processor(JOBS_QUEUE_NAME, {
  concurrency: readPositiveInteger(
    "4",
    DEFAULT_CONCURRENT_JOBS,
  ),
})
export class JobsProcessor extends WorkerHost {
  constructor(private readonly processingService: JobsProcessingService) {
    super();
  }

  async process(job: BullJob<JobQueuePayload>): Promise<void> {
    if (job.name !== PROCESS_JOB_TASK) {
      throw new Error(`Unsupported queue task: ${job.name}`);
    }

    const jobId = job.data?.jobId;
    if (typeof jobId !== 'string' || jobId.length === 0) {
      throw new Error('Queue payload does not contain a jobId');
    }

    await this.processingService.process(jobId);
  }
}

function readPositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
