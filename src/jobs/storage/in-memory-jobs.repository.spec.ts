import { createJob } from '../domain/job.factory';
import { Job } from '../domain/job.types';
import { InMemoryJobsRepository } from './in-memory-jobs.repository';
import { InvalidJobsCursorError } from './invalid-jobs-cursor.error';

describe('InMemoryJobsRepository', () => {
  let repository: InMemoryJobsRepository;

  beforeEach(() => {
    repository = new InMemoryJobsRepository();
  });

  it('saves and retrieves a defensive copy of a job', async () => {
    const job = buildJob('job-1', '2026-07-26T12:00:00.000Z');

    await repository.save(job);
    job.items[0].url = 'https://mutated.test';

    const storedJob = await repository.findById(job.id);

    expect(storedJob?.items[0].url).toBe('https://example.com');
    expect(await repository.findById('missing')).toBeNull();
  });

  it('returns newest jobs first using an opaque cursor', async () => {
    await repository.save(buildJob('job-1', '2026-07-26T10:00:00.000Z'));
    await repository.save(buildJob('job-2', '2026-07-26T11:00:00.000Z'));
    await repository.save(buildJob('job-3', '2026-07-26T12:00:00.000Z'));

    const firstPage = await repository.findPage({ limit: 2 });
    const secondPage = await repository.findPage({
      limit: 2,
      cursor: firstPage.nextCursor as string,
    });

    expect(firstPage.items.map((job) => job.id)).toEqual(['job-3', 'job-2']);
    expect(firstPage.nextCursor).not.toBeNull();
    expect(secondPage.items.map((job) => job.id)).toEqual(['job-1']);
    expect(secondPage.nextCursor).toBeNull();
  });

  it('rejects invalid pagination input', () => {
    expect(() => repository.findPage({ limit: 0 })).toThrow(RangeError);
    expect(() => repository.findPage({ limit: 10, cursor: 'invalid' })).toThrow(
      InvalidJobsCursorError,
    );
  });
});

function buildJob(id: string, createdAt: string): Job {
  const ids = [id, `${id}-item`];
  return createJob(['https://example.com'], {
    createId: () => ids.shift() as string,
    now: () => new Date(createdAt),
  });
}
