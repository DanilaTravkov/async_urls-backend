import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from './../src/app.config';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('/docs (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs')
      .expect(200);

    expect(response.text).toContain('Async URL Checker API');
  });

  it('does not expose endpoints outside the specification', async () => {
    await request(app.getHttpServer()).get('/docs-json').expect(404);
    await request(app.getHttpServer()).get('/api/health').expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
