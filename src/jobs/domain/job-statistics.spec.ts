import { createJob } from './job.factory';
import { calculateJobStatistics } from './job-statistics';
import { JobStatistics } from './job.types';
import { UrlCheckStatus } from './url-check-status.enum';

describe('calculateJobStatistics', () => {
  it('counts every URL status', () => {
    const job = createJob([
      'https://pending.test',
      'https://in-progress.test',
      'https://success.test',
      'https://error.test',
      'https://cancelled.test',
    ]);
    const statuses = Object.values(UrlCheckStatus);

    job.items.forEach((item, index) => {
      item.status = statuses[index];
    });

    const statistics = calculateJobStatistics(job.items);

    expect(statistics).toBeInstanceOf(JobStatistics);
    expect(statistics).toEqual({
      pending: 1,
      inProgress: 1,
      success: 1,
      error: 1,
      cancelled: 1,
    });
  });

  it('returns zeroes for an empty job', () => {
    expect(calculateJobStatistics([])).toEqual({
      pending: 0,
      inProgress: 0,
      success: 0,
      error: 0,
      cancelled: 0,
    });
  });
});
