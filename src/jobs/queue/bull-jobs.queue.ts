import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobQueuePayload } from './job-queue-payload';
import { JOBS_QUEUE_NAME, PROCESS_JOB_TASK } from './jobs-queue.constants';
import { JobsQueue } from './jobs.queue';

@Injectable()
export class BullJobsQueue extends JobsQueue {
  constructor(
    @InjectQueue(JOBS_QUEUE_NAME)
    private readonly queue: Queue<JobQueuePayload>,
  ) {
    super();
  }

  async enqueue(jobId: string): Promise<void> {
    await this.queue.add(PROCESS_JOB_TASK, new JobQueuePayload(jobId), {
      jobId,
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 1000 },
    });
  }
}
