import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsProcessor } from './processing/jobs.processor';
import { JobsProcessingService } from './processing/jobs-processing.service';
import { FetchHttpHeadClient } from './processing/fetch-http-head.client';
import { HttpHeadClient } from './processing/http-head-client';
import { ProcessingDelay } from './processing/processing-delay';
import { RandomProcessingDelay } from './processing/random-processing.delay';
import { BullJobsQueue } from './queue/bull-jobs.queue';
import { InMemoryJobsQueue } from './queue/in-memory-jobs.queue';
import { JOBS_QUEUE_NAME } from './queue/jobs-queue.constants';
import { JobsQueue } from './queue/jobs.queue';
import { JobsService } from './jobs.service';
import { InMemoryJobsRepository } from './storage/in-memory-jobs.repository';
import { JobsRepository } from './storage/jobs.repository';

const queueEnabled = process.env.NODE_ENV !== 'test';

@Module({
  imports: queueEnabled
    ? [
        BullModule.forRoot({
          connection: {
            host: process.env.REDIS_HOST ?? 'localhost',
            port: readRedisPort(process.env.REDIS_PORT),
          },
        }),
        BullModule.registerQueue({ name: JOBS_QUEUE_NAME }),
      ]
    : [],
  controllers: [JobsController],
  providers: [
    JobsService,
    InMemoryJobsRepository,
    {
      provide: JobsRepository,
      useExisting: InMemoryJobsRepository,
    },
    ...(queueEnabled
      ? [
          BullJobsQueue,
          {
            provide: JobsQueue,
            useExisting: BullJobsQueue,
          },
          FetchHttpHeadClient,
          {
            provide: HttpHeadClient,
            useExisting: FetchHttpHeadClient,
          },
          RandomProcessingDelay,
          {
            provide: ProcessingDelay,
            useExisting: RandomProcessingDelay,
          },
          JobsProcessingService,
          JobsProcessor,
        ]
      : [
          InMemoryJobsQueue,
          {
            provide: JobsQueue,
            useExisting: InMemoryJobsQueue,
          },
        ]),
  ],
  exports: [JobsRepository, JobsService],
})
export class JobsModule {}

function readRedisPort(value: string | undefined): number {
  const port = Number(value ?? 6379);
  return Number.isInteger(port) && port > 0 && port <= 65_535 ? port : 6379;
}
