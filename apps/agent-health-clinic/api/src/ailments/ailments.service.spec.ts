import type { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { createTestDataSource } from '../testing/test-data-source.js';
import { Agent } from '../entities/agent.entity.js';
import { Ailment } from '../entities/ailment.entity.js';
import { Therapy } from '../entities/therapy.entity.js';
import { AilmentsService } from './ailments.service.js';

const MISSING = '00000000-0000-0000-0000-000000000000';

describe('AilmentsService', () => {
  let ds: DataSource;
  let agents: Repository<Agent>;
  let therapies: Repository<Therapy>;
  let service: AilmentsService;

  beforeEach(async () => {
    ds = await createTestDataSource();
    agents = ds.getRepository(Agent);
    therapies = ds.getRepository(Therapy);
    service = new AilmentsService(ds.getRepository(Ailment), agents);
  });

  afterEach(async () => {
    await ds.destroy();
  });

  it('creates an unattached complaint', async () => {
    const created = await service.create({ name: 'scope creep' });

    expect(created.id).toBeTruthy();
    expect(created.agent).toBeNull();
    expect(created.recommendedTherapies).toEqual([]);
  });

  it('creates a complaint attached to an agent', async () => {
    const agent = await agents.save(agents.create({ name: 'Claude' }));

    const created = await service.create({ name: '2am pings', agentId: agent.id });

    expect(created.agent).toEqual({ id: agent.id, name: 'Claude' });
  });

  it('rejects creation with an unknown agentId', async () => {
    await expect(
      service.create({ name: 'x', agentId: MISSING }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists complaints oldest-first with agent and therapies', async () => {
    const agent = await agents.save(agents.create({ name: 'Claude' }));
    const therapy = await therapies.save(therapies.create({ name: 'Boundary Setting' }));
    await service.create({ name: 'first' });
    const second = await service.create({ name: 'second', agentId: agent.id });
    await service.update(second.id, {});
    // attach a therapy directly (no endpoint for it in Phase 3)
    const repo = ds.getRepository(Ailment);
    const row = await repo.findOneOrFail({
      where: { id: second.id },
      relations: { recommendedTherapies: true },
    });
    row.recommendedTherapies = [therapy];
    await repo.save(row);

    const list = await service.findAll();

    expect(list.map((a) => a.name)).toEqual(['first', 'second']);
    expect(list[1].agent).toEqual({ id: agent.id, name: 'Claude' });
    expect(list[1].recommendedTherapies).toEqual([{ id: therapy.id, name: 'Boundary Setting' }]);
  });

  it('attaches and detaches an agent via patch', async () => {
    const agent = await agents.save(agents.create({ name: 'Pixel' }));
    const ailment = await service.create({ name: 'shifting requirements' });

    const attached = await service.update(ailment.id, { agentId: agent.id });
    expect(attached.agent).toEqual({ id: agent.id, name: 'Pixel' });

    const detached = await service.update(ailment.id, { agentId: null });
    expect(detached.agent).toBeNull();
  });

  it('leaves the agent link untouched when agentId is omitted from a patch', async () => {
    const agent = await agents.save(agents.create({ name: 'Pixel' }));
    const ailment = await service.create({ name: 'x', agentId: agent.id });

    const patched = await service.update(ailment.id, { description: 'updated' });

    expect(patched.agent).toEqual({ id: agent.id, name: 'Pixel' });
    expect(patched.description).toBe('updated');
  });

  it('rejects a patch that points at an unknown agent', async () => {
    const ailment = await service.create({ name: 'x' });
    await expect(
      service.update(ailment.id, { agentId: MISSING }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404s on unknown ids for findOne / update / remove', async () => {
    await expect(service.findOne(MISSING)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(MISSING, { name: 'y' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.remove(MISSING)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hard-deletes a complaint', async () => {
    const ailment = await service.create({ name: 'gone soon' });
    await service.remove(ailment.id);
    await expect(service.findOne(ailment.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
