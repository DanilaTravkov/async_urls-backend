import { Queue } from 'bullmq';
import { BullJobsQueue } from './bull-jobs.queue';
import { JobQueuePayload } from './job-queue-payload';
import { PROCESS_JOB_TASK } from './jobs-queue.constants';

describe('BullJobsQueue', () => {
  it('uses the application job ID as the idempotent BullMQ job ID', async () => {
    const add = jest.fn().mockResolvedValue(undefined);
    const queue = { add } as unknown as Queue<JobQueuePayload>;
    const jobsQueue = new BullJobsQueue(queue);
    const jobId = '00000000-0000-4000-8000-000000000001';

    await jobsQueue.enqueue(jobId);

    expect(add).toHaveBeenCalledWith(
      PROCESS_JOB_TASK,
      new JobQueuePayload(jobId),
      {
        jobId,
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 1000 },
      },
    );
  });

  it('removes a waiting job from BullMQ', async () => {
    const remove = jest.fn().mockResolvedValue(undefined);
    const getState = jest.fn().mockResolvedValue('waiting');
    const getJob = jest.fn().mockResolvedValue({ getState, remove });
    const queue = { getJob } as unknown as Queue<JobQueuePayload>;
    const jobsQueue = new BullJobsQueue(queue);

    await jobsQueue.cancel('job-id');

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('leaves an active job for cooperative cancellation', async () => {
    const remove = jest.fn().mockResolvedValue(undefined);
    const getState = jest.fn().mockResolvedValue('active');
    const getJob = jest.fn().mockResolvedValue({ getState, remove });
    const queue = { getJob } as unknown as Queue<JobQueuePayload>;
    const jobsQueue = new BullJobsQueue(queue);

    await jobsQueue.cancel('job-id');

    expect(remove).not.toHaveBeenCalled();
  });
});
