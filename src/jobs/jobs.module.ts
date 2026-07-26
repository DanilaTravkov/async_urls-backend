import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { InMemoryJobsRepository } from './storage/in-memory-jobs.repository';
import { JobsRepository } from './storage/jobs.repository';

@Module({
  controllers: [JobsController],
  providers: [
    JobsService,
    InMemoryJobsRepository,
    {
      provide: JobsRepository,
      useExisting: InMemoryJobsRepository,
    },
  ],
  exports: [JobsRepository, JobsService],
})
export class JobsModule {}
