export abstract class JobsQueue {
  abstract enqueue(jobId: string): Promise<void>;
}
