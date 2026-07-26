import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ListJobsQueryDto } from './dto/list-jobs-query.dto';
import { InMemoryJobsQueue } from './queue/in-memory-jobs.queue';
import { JobsQueue } from './queue/jobs.queue';
import { JobsService } from './jobs.service';
import { InMemoryJobsRepository } from './storage/in-memory-jobs.repository';
import { FindJobsPageOptions } from './storage/jobs.repository';

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(() => {
    service = new JobsService(
      new InMemoryJobsRepository(),
      new InMemoryJobsQueue(),
    );
  });

  it('returns an error and marks the job failed when enqueueing fails', async () => {
    const repository = new InMemoryJobsRepository();
    const failingService = new JobsService(repository, new FailingJobsQueue());

    await expect(
      failingService.create(['https://example.com']),
    ).rejects.toThrow('The job could not be queued for processing');

    const page = await repository.findPage(new FindJobsPageOptions(10));
    expect(page.items[0].status).toBe('failed');
  });

  it('creates and retrieves a pending job', async () => {
    const created = await service.create(['https://example.com']);

    const details = await service.findById(created.jobId);

    expect(details).toMatchObject({
      id: created.jobId,
      status: 'pending',
      items: [
        {
          url: 'https://example.com',
          status: 'pending',
          httpStatus: null,
          error: null,
          startedAt: null,
          finishedAt: null,
          durationMs: null,
        },
      ],
    });
    expect(Object.keys(details).sort()).toEqual(['id', 'items', 'status']);
  });

  it('lists jobs using cursor pagination', async () => {
    await service.create(['https://first.test']);
    await service.create(['https://second.test']);

    const firstPageQuery = new ListJobsQueryDto();
    firstPageQuery.limit = 1;
    const firstPage = await service.findPage(firstPageQuery);
    const secondPageQuery = new ListJobsQueryDto();
    secondPageQuery.limit = 1;
    secondPageQuery.cursor = firstPage.nextCursor as string;
    const secondPage = await service.findPage(secondPageQuery);

    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.items[0].stats).toEqual({ success: 0, error: 0 });
    expect(firstPage.nextCursor).not.toBeNull();
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0].id).not.toBe(firstPage.items[0].id);
    expect(secondPage.nextCursor).toBeNull();
  });

  it('maps repository lookup failures to HTTP exceptions', async () => {
    await expect(
      service.findById('00000000-0000-4000-8000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);

    const query = new ListJobsQueryDto();
    query.cursor = 'invalid';
    await expect(service.findPage(query)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('cancels a job and all URL checks that have not started', async () => {
    const created = await service.create([
      'https://first.test',
      'https://second.test',
    ]);

    await service.cancel(created.jobId);
    await service.cancel(created.jobId);

    expect(await service.findById(created.jobId)).toMatchObject({
      status: 'cancelled',
      items: [{ status: 'cancelled' }, { status: 'cancelled' }],
    });
  });

  it('returns not found when cancelling a missing job', async () => {
    await expect(
      service.cancel('00000000-0000-4000-8000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

class FailingJobsQueue extends JobsQueue {
  enqueue(): Promise<void> {
    return Promise.reject(new Error('Redis is unavailable'));
  }

  cancel(): Promise<void> {
    return Promise.resolve();
  }
}
