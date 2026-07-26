import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ListJobsQueryDto } from './dto/list-jobs-query.dto';
import { JobsService } from './jobs.service';
import { InMemoryJobsRepository } from './storage/in-memory-jobs.repository';

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(() => {
    service = new JobsService(new InMemoryJobsRepository());
  });

  it('creates and retrieves a pending job', async () => {
    const created = await service.create(['https://example.com']);

    const details = await service.findById(created.jobId);

    expect(details).toMatchObject({
      id: created.jobId,
      status: 'pending',
      stats: {
        pending: 1,
        inProgress: 0,
        success: 0,
        error: 0,
        cancelled: 0,
      },
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
});
