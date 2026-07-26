import { JobStatistics, UrlCheck } from './job.types';
import { UrlCheckStatus } from './url-check-status.enum';

export function calculateJobStatistics(
  items: readonly UrlCheck[],
): JobStatistics {
  const statistics = new JobStatistics();

  for (const item of items) {
    switch (item.status) {
      case UrlCheckStatus.Pending:
        statistics.pending += 1;
        break;
      case UrlCheckStatus.InProgress:
        statistics.inProgress += 1;
        break;
      case UrlCheckStatus.Success:
        statistics.success += 1;
        break;
      case UrlCheckStatus.Error:
        statistics.error += 1;
        break;
      case UrlCheckStatus.Cancelled:
        statistics.cancelled += 1;
        break;
    }
  }

  return statistics;
}
