import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

const MISSING = '00000000-0000-0000-0000-000000000000';

describe('Agents (e2e)', () => {
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

  it('runs the full agent lifecycle over HTTP', async () => {
    // create
    const created = await http()
      .post('/agents')
      .send({ name: '  Claude  ', description: 'overworked' })
      .expect(201);
    expect(created.body.name).toBe('Claude'); // trimmed
    expect(created.body.ailments).toEqual([]);
    const id: string = created.body.id;

    // add a complaint via the check-in shortcut
    const ailment = await http()
      .post(`/agents/${id}/ailments`)
      .send({ name: '2am pings' })
      .expect(201);
    expect(ailment.body.agent).toEqual({ id, name: 'Claude' });

    // list — includes the agent with its complaint
    const list = await http().get('/agents').expect(200);
    const mine = list.body.find((a: { id: string }) => a.id === id);
    expect(mine.ailments.map((x: { name: string }) => x.name)).toEqual(['2am pings']);

    // get one
    const one = await http().get(`/agents/${id}`).expect(200);
    expect(one.body.ailments[0].recommendedTherapies).toEqual([]);

    // patch
    const patched = await http()
      .patch(`/agents/${id}`)
      .send({ description: 'recovering' })
      .expect(200);
    expect(patched.body.description).toBe('recovering');
    expect(patched.body.name).toBe('Claude');

    // delete
    await http().delete(`/agents/${id}`).expect(204);
    await http().get(`/agents/${id}`).expect(404);

    // the complaint survives, now detached
    const ailmentAfter = await http()
      .get(`/ailments/${ailment.body.id}`)
      .expect(200);
    expect(ailmentAfter.body.agent).toBeNull();
  });

  it('rejects an empty name with 400', async () => {
    await http().post('/agents').send({ name: '   ' }).expect(400);
    await http().post('/agents').send({}).expect(400);
  });

  it('rejects unknown body fields with 400', async () => {
    await http()
      .post('/agents')
      .send({ name: 'Ada', nickname: 'not allowed' })
      .expect(400);
  });

  it('404s for unknown ids', async () => {
    await http().get(`/agents/${MISSING}`).expect(404);
    await http().patch(`/agents/${MISSING}`).send({ name: 'x' }).expect(404);
    await http().delete(`/agents/${MISSING}`).expect(404);
    await http().post(`/agents/${MISSING}/ailments`).send({ name: 'x' }).expect(404);
  });

  it('400s for a malformed uuid path param', async () => {
    await http().get('/agents/not-a-uuid').expect(400);
  });
});
