import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

const MISSING = '00000000-0000-0000-0000-000000000000';

describe('Ailments (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';
    process.env.DB_SYNCHRONIZE = 'true';
    process.env.ENABLE_DEV_UI = 'true';

    const { AppModule } = await import('./../src/app.module.js');
    const { configureApp } = await import('./../src/app-config.js');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('creates unattached, attaches, detaches, then deletes', async () => {
    const agent = await http().post('/agents').send({ name: 'Pixel' }).expect(201);
    const agentId: string = agent.body.id;

    const created = await http()
      .post('/ailments')
      .send({ name: 'shifting requirements' })
      .expect(201);
    expect(created.body.agent).toBeNull();
    const id: string = created.body.id;

    const attached = await http()
      .patch(`/ailments/${id}`)
      .send({ agentId })
      .expect(200);
    expect(attached.body.agent).toEqual({ id: agentId, name: 'Pixel' });

    const detached = await http()
      .patch(`/ailments/${id}`)
      .send({ agentId: null })
      .expect(200);
    expect(detached.body.agent).toBeNull();

    const list = await http().get('/ailments').expect(200);
    expect(list.body.some((a: { id: string }) => a.id === id)).toBe(true);

    await http().delete(`/ailments/${id}`).expect(204);
    await http().get(`/ailments/${id}`).expect(404);
  });

  it('creates attached in one call', async () => {
    const agent = await http().post('/agents').send({ name: 'Claude' }).expect(201);
    const created = await http()
      .post('/ailments')
      .send({ name: '2am pings', agentId: agent.body.id })
      .expect(201);
    expect(created.body.agent.name).toBe('Claude');
  });

  it('validates the body', async () => {
    await http().post('/ailments').send({}).expect(400); // missing name
    await http().post('/ailments').send({ name: 'x', bogus: 1 }).expect(400);
    await http().post('/ailments').send({ name: 'x', agentId: 'not-a-uuid' }).expect(400);
  });

  it('404s on an unknown agentId', async () => {
    await http().post('/ailments').send({ name: 'x', agentId: MISSING }).expect(404);
    const created = await http().post('/ailments').send({ name: 'x' }).expect(201);
    await http()
      .patch(`/ailments/${created.body.id}`)
      .send({ agentId: MISSING })
      .expect(404);
  });

  it('404s on unknown ailment ids', async () => {
    await http().get(`/ailments/${MISSING}`).expect(404);
    await http().patch(`/ailments/${MISSING}`).send({ name: 'x' }).expect(404);
    await http().delete(`/ailments/${MISSING}`).expect(404);
  });
});
