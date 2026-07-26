import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createJob } from './domain/job.factory';
import { calculateJobStatistics } from './domain/job-statistics';
import { JobStatus } from './domain/job-status.enum';
import {
  JobDetailsResponseDto,
  JobIdResponseDto,
  JobsPageResponseDto,
  JobSummaryDto,
} from './dto/job-response.dto';
import { ListJobsQueryDto } from './dto/list-jobs-query.dto';
import { JobsQueue } from './queue/jobs.queue';
import { InvalidJobsCursorError } from './storage/invalid-jobs-cursor.error';
import { FindJobsPageOptions, JobsRepository } from './storage/jobs.repository';

@Injectable()
export class JobsService {
  constructor(
    private readonly jobsRepository: JobsRepository,
    private readonly jobsQueue: JobsQueue,
  ) {}

  async create(urls: readonly string[]): Promise<JobIdResponseDto> {
    const job = createJob(urls);
    await this.jobsRepository.save(job);

    try {
      await this.jobsQueue.enqueue(job.id);
    } catch {
      job.status = JobStatus.Failed;
      await this.jobsRepository.save(job);
      throw new ServiceUnavailableException(
        'The job could not be queued for processing',
      );
    }

    return new JobIdResponseDto(job.id);
  }

  async findPage(query: ListJobsQueryDto): Promise<JobsPageResponseDto> {
    try {
      const page = await this.jobsRepository.findPage(
        new FindJobsPageOptions(query.limit, query.cursor),
      );
      const items = page.items.map(
        (job) => new JobSummaryDto(job, calculateJobStatistics(job.items)),
      );

      return new JobsPageResponseDto(items, page.nextCursor);
    } catch (error) {
      if (error instanceof InvalidJobsCursorError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  async findById(id: string): Promise<JobDetailsResponseDto> {
    const job = await this.jobsRepository.findById(id);

    if (!job) {
      throw new NotFoundException(`Job ${id} was not found`);
    }

    return new JobDetailsResponseDto(job);
  }
}
