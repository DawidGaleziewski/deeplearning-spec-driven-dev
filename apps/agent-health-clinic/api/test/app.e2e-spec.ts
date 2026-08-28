import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

describe('AppModule (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    // Boot the full module tree against a throwaway in-memory schema.
    process.env.DATABASE_PATH = ':memory:';
    process.env.DB_SYNCHRONIZE = 'true';
    process.env.ENABLE_DEV_UI = 'true';

    const { AppModule } = await import('./../src/app.module.js');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('boots with all entity modules registered', () => {
    // app.init() above throws on any DI/wiring error, so reaching here is the
    // assertion. Keep an explicit check too.
    expect(app).toBeDefined();
  });

  it('/ (GET) still serves the health-check string', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('/dev (GET) serves the test UI page', () => {
    return request(app.getHttpServer())
      .get('/dev')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(/data model test UI/);
  });

  it('round-trips an agent through the dev endpoints', async () => {
    const created = await request(app.getHttpServer())
      .post('/dev/agents')
      .send({ name: 'E2E Agent', description: 'temp' })
      .expect(201);
    expect(created.body.id).toBeTruthy();

    const list = await request(app.getHttpServer()).get('/dev/agents').expect(200);
    expect(list.body.map((a: { name: string }) => a.name)).toContain('E2E Agent');
  });
});
