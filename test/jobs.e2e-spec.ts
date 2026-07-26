import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from './../src/app.config';
import { AppModule } from './../src/app.module';
import {
  JobIdResponseDto,
  JobsPageResponseDto,
} from './../src/jobs/dto/job-response.dto';

describe('Jobs API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates a job and returns its details', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/jobs')
      .send({
        urls: ['https://example.com', 'https://example.com'],
      })
      .expect(202);

    const created = createResponse.body as JobIdResponseDto;
    const jobId = created.jobId;
    expect(Object.keys(created)).toEqual(['jobId']);
    const detailsResponse = await request(app.getHttpServer())
      .get(`/api/jobs/${jobId}`)
      .expect(200);

    expect(detailsResponse.body).toMatchObject({
      id: jobId,
      status: 'pending',
      items: [
        { url: 'https://example.com', status: 'pending' },
        { url: 'https://example.com', status: 'pending' },
      ],
    });
    expect(Object.keys(detailsResponse.body as object).sort()).toEqual([
      'id',
      'items',
      'status',
    ]);
  });

  it('lists jobs using cursor pagination', async () => {
    for (const url of [
      'https://first.test',
      'https://second.test',
      'https://third.test',
    ]) {
      await request(app.getHttpServer())
        .post('/api/jobs')
        .send({ urls: [url] })
        .expect(202);
    }

    const firstPage = await request(app.getHttpServer())
      .get('/api/jobs?limit=2')
      .expect(200);
    const firstPageBody = firstPage.body as JobsPageResponseDto;

    expect(firstPageBody.items).toHaveLength(2);
    expect(firstPageBody.nextCursor).toEqual(expect.any(String));
    expect(firstPageBody.items[0].stats).toEqual({ success: 0, error: 0 });
    expect(Object.keys(firstPageBody.items[0]).sort()).toEqual([
      'createdAt',
      'id',
      'stats',
      'status',
      'urlCount',
    ]);

    const secondPage = await request(app.getHttpServer())
      .get('/api/jobs')
      .query({ limit: 2, cursor: firstPageBody.nextCursor as string })
      .expect(200);
    const secondPageBody = secondPage.body as JobsPageResponseDto;

    expect(secondPageBody.items).toHaveLength(1);
    expect(secondPageBody.nextCursor).toBeNull();
  });

  it('validates request bodies, pagination and job IDs', async () => {
    await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: [] })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: ['ftp://example.com'] })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: ['https://example.com'], extra: true })
      .expect(400);
    await request(app.getHttpServer()).get('/api/jobs?limit=101').expect(400);
    await request(app.getHttpServer())
      .get('/api/jobs?cursor=invalid')
      .expect(400);
    await request(app.getHttpServer()).get('/api/jobs/not-a-uuid').expect(400);
    await request(app.getHttpServer())
      .get('/api/jobs/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('cancels a job and its pending URL checks', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: ['https://first.test', 'https://second.test'] })
      .expect(202);
    const created = createResponse.body as JobIdResponseDto;

    await request(app.getHttpServer())
      .delete(`/api/jobs/${created.jobId}`)
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/api/jobs/${created.jobId}`)
      .expect(204);

    const detailsResponse = await request(app.getHttpServer())
      .get(`/api/jobs/${created.jobId}`)
      .expect(200);

    expect(detailsResponse.body).toMatchObject({
      status: 'cancelled',
      items: [{ status: 'cancelled' }, { status: 'cancelled' }],
    });
    await request(app.getHttpServer())
      .delete('/api/jobs/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });
});
