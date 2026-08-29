import type { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { createTestDataSource } from '../testing/test-data-source.js';
import { Agent } from '../entities/agent.entity.js';
import { Ailment } from '../entities/ailment.entity.js';
import { Therapy } from '../entities/therapy.entity.js';
import { AgentsService } from './agents.service.js';

describe('AgentsService', () => {
  let ds: DataSource;
  let agents: Repository<Agent>;
  let ailments: Repository<Ailment>;
  let therapies: Repository<Therapy>;
  let service: AgentsService;

  beforeEach(async () => {
    ds = await createTestDataSource();
    agents = ds.getRepository(Agent);
    ailments = ds.getRepository(Ailment);
    therapies = ds.getRepository(Therapy);
    service = new AgentsService(agents);
  });

  afterEach(async () => {
    await ds.destroy();
  });

  it('creates an agent and returns the wire shape', async () => {
    const created = await service.create({ name: 'Claude', description: 'tired' });

    expect(created.id).toBeTruthy();
    expect(created.name).toBe('Claude');
    expect(created.description).toBe('tired');
    expect(created.ailments).toEqual([]);
    expect(typeof created.createdAt).toBe('string');
    expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
  });

  it('lists agents oldest-first, each with its ailments', async () => {
    const a = await service.create({ name: 'Claude' });
    await service.create({ name: 'Pixel' });
    await ailments.save(ailments.create({ name: '2am pings', agent: { id: a.id } as Agent }));

    const list = await service.findAll();

    expect(list.map((x) => x.name)).toEqual(['Claude', 'Pixel']);
    expect(list[0].ailments.map((x) => x.name)).toEqual(['2am pings']);
  });

  it('returns one agent with ailments and their recommended therapies', async () => {
    const a = await service.create({ name: 'Claude' });
    const therapy = await therapies.save(therapies.create({ name: 'Boundary Setting' }));
    await ailments.save(
      ailments.create({
        name: 'scope creep',
        agent: { id: a.id } as Agent,
        recommendedTherapies: [therapy],
      }),
    );

    const found = await service.findOne(a.id);

    expect(found.ailments).toHaveLength(1);
    expect(found.ailments[0].recommendedTherapies).toEqual([
      { id: therapy.id, name: 'Boundary Setting' },
    ]);
  });

  it('throws NotFound for an unknown id', async () => {
    await expect(
      service.findOne('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('patches name and description independently', async () => {
    const a = await service.create({ name: 'Ada', description: 'buried' });

    const renamed = await service.update(a.id, { name: 'Ada Lovelace' });
    expect(renamed.name).toBe('Ada Lovelace');
    expect(renamed.description).toBe('buried');

    const cleared = await service.update(a.id, { description: null });
    expect(cleared.description).toBeNull();
    expect(cleared.name).toBe('Ada Lovelace');
  });

  it('rejects a patch to an unknown id', async () => {
    await expect(
      service.update('00000000-0000-0000-0000-000000000000', { name: 'ghost' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hard-deletes an agent and detaches (does not delete) its ailments', async () => {
    const a = await service.create({ name: 'Claude' });
    const ailment = await ailments.save(
      ailments.create({ name: '2am pings', agent: { id: a.id } as Agent }),
    );

    await service.remove(a.id);

    expect(await agents.findOneBy({ id: a.id })).toBeNull();
    const orphan = await ailments.findOne({
      where: { id: ailment.id },
      relations: { agent: true },
    });
    expect(orphan).not.toBeNull();
    expect(orphan?.agent).toBeNull();
  });

  it('rejects deleting an unknown id', async () => {
    await expect(
      service.remove('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
