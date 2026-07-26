import { createJob } from './job.factory';
import { JobStatus } from './job-status.enum';
import { UrlCheckStatus } from './url-check-status.enum';

describe('createJob', () => {
  it('creates a pending job and preserves duplicate URLs as separate items', () => {
    const ids = ['job-id', 'item-1', 'item-2'];
    const createdAt = new Date('2026-07-26T12:00:00.000Z');

    const job = createJob(['https://example.com', 'https://example.com'], {
      createId: () => ids.shift() as string,
      now: () => createdAt,
    });

    expect(job).toEqual({
      id: 'job-id',
      createdAt,
      status: JobStatus.Pending,
      items: [
        {
          id: 'item-1',
          url: 'https://example.com',
          status: UrlCheckStatus.Pending,
          httpStatus: null,
          error: null,
          startedAt: null,
          finishedAt: null,
          durationMs: null,
        },
        {
          id: 'item-2',
          url: 'https://example.com',
          status: UrlCheckStatus.Pending,
          httpStatus: null,
          error: null,
          startedAt: null,
          finishedAt: null,
          durationMs: null,
        },
      ],
    });
  });
});
