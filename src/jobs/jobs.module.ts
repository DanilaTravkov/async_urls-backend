import { Module } from '@nestjs/common';
import { InMemoryJobsRepository } from './storage/in-memory-jobs.repository';
import { JobsRepository } from './storage/jobs.repository';

@Module({
  providers: [
    InMemoryJobsRepository,
    {
      provide: JobsRepository,
      useExisting: InMemoryJobsRepository,
    },
  ],
  exports: [JobsRepository],
})
export class JobsModule {}
