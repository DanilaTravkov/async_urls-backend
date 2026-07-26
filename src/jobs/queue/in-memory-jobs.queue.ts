import { Injectable } from '@nestjs/common';
import { JobsQueue } from './jobs.queue';

@Injectable()
export class InMemoryJobsQueue extends JobsQueue {
  enqueue(): Promise<void> {
    return Promise.resolve();
  }

  cancel(): Promise<void> {
    return Promise.resolve();
  }
}
