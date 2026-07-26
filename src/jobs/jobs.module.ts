import { Module } from '@nestjs/common';
import { InMemoryJobsRepository } from './storage/in-memory-jobs.repository';
import { JOBS_REPOSITORY } from './storage/jobs-repository.interface';

@Module({
  providers: [
    InMemoryJobsRepository,
    {
      provide: JOBS_REPOSITORY,
      useExisting: InMemoryJobsRepository,
    },
  ],
  exports: [JOBS_REPOSITORY],
})
export class JobsModule {}
