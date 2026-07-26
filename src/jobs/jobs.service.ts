import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createJob } from './domain/job.factory';
import { calculateJobStatistics } from './domain/job-statistics';
import {
  JobDetailsResponseDto,
  JobIdResponseDto,
  JobsPageResponseDto,
  JobSummaryDto,
} from './dto/job-response.dto';
import { ListJobsQueryDto } from './dto/list-jobs-query.dto';
import { InvalidJobsCursorError } from './storage/invalid-jobs-cursor.error';
import { FindJobsPageOptions, JobsRepository } from './storage/jobs.repository';

@Injectable()
export class JobsService {
  constructor(private readonly jobsRepository: JobsRepository) {}

  async create(urls: readonly string[]): Promise<JobIdResponseDto> {
    const job = createJob(urls);
    await this.jobsRepository.save(job);
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
