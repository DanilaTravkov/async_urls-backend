export abstract class JobsQueue {
  abstract enqueue(jobId: string): Promise<void>;
  abstract cancel(jobId: string): Promise<void>;
}
