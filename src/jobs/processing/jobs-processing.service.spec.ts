import { createJob } from '../domain/job.factory';
import { JobStatus } from '../domain/job-status.enum';
import { UrlCheckStatus } from '../domain/url-check-status.enum';
import { InMemoryJobsQueue } from '../queue/in-memory-jobs.queue';
import { JobsService } from '../jobs.service';
import { InMemoryJobsRepository } from '../storage/in-memory-jobs.repository';
import { HttpHeadClient } from './http-head-client';
import { JobsProcessingService } from './jobs-processing.service';
import { ProcessingDelay } from './processing-delay';

describe('JobsProcessingService', () => {
  it('limits concurrent HEAD requests to five per job', async () => {
    const repository = new InMemoryJobsRepository();
    const httpClient = new TrackingHttpHeadClient();
    const job = createJob(
      Array.from({ length: 12 }, (_, index) => `https://url-${index}.test`),
    );
    await repository.save(job);
    const service = new JobsProcessingService(
      repository,
      httpClient,
      new ImmediateDelay(),
    );

    await service.process(job.id);

    const storedJob = await repository.findById(job.id);
    expect(httpClient.maximumConcurrency).toBe(5);
    expect(httpClient.calls).toBe(12);
    expect(storedJob?.status).toBe(JobStatus.Completed);
    expect(
      storedJob?.items.every((item) => item.status === UrlCheckStatus.Success),
    ).toBe(true);
  });

  it('stores HTTP statuses, errors, timestamps and applies every delay', async () => {
    const repository = new InMemoryJobsRepository();
    const delay = new ImmediateDelay();
    const job = createJob([
      'https://success.test',
      'https://network-error.test',
    ]);
    await repository.save(job);
    const service = new JobsProcessingService(
      repository,
      new ResultHttpHeadClient(),
      delay,
    );

    await service.process(job.id);

    const storedJob = await repository.findById(job.id);
    expect(storedJob?.status).toBe(JobStatus.Completed);
    expect(storedJob?.items[0]).toMatchObject({
      status: UrlCheckStatus.Success,
      httpStatus: 503,
      error: null,
    });
    expect(storedJob?.items[1]).toMatchObject({
      status: UrlCheckStatus.Error,
      httpStatus: null,
      error: 'Connection refused',
    });
    expect(storedJob?.items[0].startedAt).toBeInstanceOf(Date);
    expect(storedJob?.items[0].finishedAt).toBeInstanceOf(Date);
    expect(storedJob?.items[0].durationMs).toEqual(expect.any(Number));
    expect(delay.calls).toBe(2);
  });

  it('marks a job failed on an orchestration error', async () => {
    const repository = new InMemoryJobsRepository();
    const job = createJob(['https://example.com']);
    await repository.save(job);
    const service = new JobsProcessingService(
      repository,
      new ResultHttpHeadClient(),
      new FailingDelay(),
    );

    await expect(service.process(job.id)).rejects.toThrow('Delay failed');

    expect((await repository.findById(job.id))?.status).toBe(JobStatus.Failed);
  });

  it('finishes active checks and cancels checks that have not started', async () => {
    const repository = new InMemoryJobsRepository();
    const httpClient = new BlockingHttpHeadClient();
    const job = createJob(
      Array.from({ length: 6 }, (_, index) => `https://url-${index}.test`),
    );
    await repository.save(job);
    const processingService = new JobsProcessingService(
      repository,
      httpClient,
      new ImmediateDelay(),
    );
    const jobsService = new JobsService(repository, new InMemoryJobsQueue());

    const processing = processingService.process(job.id);
    await httpClient.waitUntilStarted(5);
    await jobsService.cancel(job.id);
    httpClient.releaseAll();
    await processing;

    const storedJob = await repository.findById(job.id);
    expect(httpClient.calls).toBe(5);
    expect(storedJob?.status).toBe(JobStatus.Cancelled);
    expect(
      storedJob?.items.filter((item) => item.status === UrlCheckStatus.Success),
    ).toHaveLength(5);
    expect(
      storedJob?.items.filter(
        (item) => item.status === UrlCheckStatus.Cancelled,
      ),
    ).toHaveLength(1);
  });
});

class TrackingHttpHeadClient extends HttpHeadClient {
  calls = 0;
  maximumConcurrency = 0;
  private activeRequests = 0;

  async check(): Promise<number> {
    this.calls += 1;
    this.activeRequests += 1;
    this.maximumConcurrency = Math.max(
      this.maximumConcurrency,
      this.activeRequests,
    );
    await new Promise((resolve) => setImmediate(resolve));
    this.activeRequests -= 1;
    return 200;
  }
}

class ResultHttpHeadClient extends HttpHeadClient {
  check(url: string): Promise<number> {
    return url.includes('network-error')
      ? Promise.reject(new Error('Connection refused'))
      : Promise.resolve(503);
  }
}

class ImmediateDelay extends ProcessingDelay {
  calls = 0;

  wait(): Promise<void> {
    this.calls += 1;
    return Promise.resolve();
  }
}

class FailingDelay extends ProcessingDelay {
  wait(): Promise<void> {
    return Promise.reject(new Error('Delay failed'));
  }
}

class BlockingHttpHeadClient extends HttpHeadClient {
  calls = 0;
  private readonly releases: Array<() => void> = [];

  check(): Promise<number> {
    this.calls += 1;
    return new Promise((resolve) => {
      this.releases.push(() => resolve(200));
    });
  }

  async waitUntilStarted(expectedCalls: number): Promise<void> {
    while (this.calls < expectedCalls) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  releaseAll(): void {
    for (const release of this.releases) {
      release();
    }
  }
}
