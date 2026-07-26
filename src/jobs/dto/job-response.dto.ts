import { ApiProperty } from '@nestjs/swagger';
import { JobStatus } from '../domain/job-status.enum';
import { Job, JobStatistics, UrlCheck } from '../domain/job.types';
import { UrlCheckStatus } from '../domain/url-check-status.enum';

export class JobIdResponseDto {
  @ApiProperty({ format: 'uuid' })
  jobId!: string;

  constructor(jobId: string) {
    this.jobId = jobId;
  }
}

export class JobStatisticsDto {
  @ApiProperty()
  pending!: number;

  @ApiProperty()
  inProgress!: number;

  @ApiProperty()
  success!: number;

  @ApiProperty()
  error!: number;

  @ApiProperty()
  cancelled!: number;

  constructor(statistics: JobStatistics) {
    this.pending = statistics.pending;
    this.inProgress = statistics.inProgress;
    this.success = statistics.success;
    this.error = statistics.error;
    this.cancelled = statistics.cancelled;
  }
}

export class JobSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ enum: JobStatus, enumName: 'JobStatus' })
  status!: JobStatus;

  @ApiProperty()
  urlCount!: number;

  @ApiProperty({ type: JobStatisticsDto })
  stats!: JobStatisticsDto;

  constructor(job: Job, statistics: JobStatistics) {
    this.id = job.id;
    this.createdAt = job.createdAt.toISOString();
    this.status = job.status;
    this.urlCount = job.items.length;
    this.stats = new JobStatisticsDto(statistics);
  }
}

export class JobsPageResponseDto {
  @ApiProperty({ type: [JobSummaryDto] })
  items!: JobSummaryDto[];

  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;

  constructor(items: JobSummaryDto[], nextCursor: string | null) {
    this.items = items;
    this.nextCursor = nextCursor;
  }
}

export class UrlCheckResponseDto {
  @ApiProperty()
  url!: string;

  @ApiProperty({ enum: UrlCheckStatus, enumName: 'UrlCheckStatus' })
  status!: UrlCheckStatus;

  @ApiProperty({ nullable: true, type: Number })
  httpStatus!: number | null;

  @ApiProperty({ nullable: true, type: String })
  error!: string | null;

  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  startedAt!: string | null;

  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  finishedAt!: string | null;

  @ApiProperty({ nullable: true, type: Number })
  durationMs!: number | null;

  constructor(item: UrlCheck) {
    this.url = item.url;
    this.status = item.status;
    this.httpStatus = item.httpStatus;
    this.error = item.error;
    this.startedAt = item.startedAt?.toISOString() ?? null;
    this.finishedAt = item.finishedAt?.toISOString() ?? null;
    this.durationMs = item.durationMs;
  }
}

export class JobDetailsResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ enum: JobStatus, enumName: 'JobStatus' })
  status!: JobStatus;

  @ApiProperty({ type: JobStatisticsDto })
  stats!: JobStatisticsDto;

  @ApiProperty({ type: [UrlCheckResponseDto] })
  items!: UrlCheckResponseDto[];

  constructor(job: Job, statistics: JobStatistics) {
    this.id = job.id;
    this.createdAt = job.createdAt.toISOString();
    this.status = job.status;
    this.stats = new JobStatisticsDto(statistics);
    this.items = job.items.map((item) => new UrlCheckResponseDto(item));
  }
}
