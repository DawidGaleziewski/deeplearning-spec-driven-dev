import type { DataSource, Repository } from 'typeorm';
import { createTestDataSource } from '../testing/test-data-source.js';
import { Agent } from '../entities/agent.entity.js';
import { Ailment } from '../entities/ailment.entity.js';

describe('Agent repository', () => {
  let ds: DataSource;
  let agents: Repository<Agent>;
  let ailments: Repository<Ailment>;

  beforeEach(async () => {
    ds = await createTestDataSource();
    agents = ds.getRepository(Agent);
    ailments = ds.getRepository(Ailment);
  });

  afterEach(async () => {
    await ds.destroy();
  });

  it('creates and reads an agent', async () => {
    const saved = await agents.save(
      agents.create({ name: 'Claude', description: 'overworked' }),
    );
    expect(saved.id).toBeTruthy();

    const found = await agents.findOneByOrFail({ id: saved.id });
    expect(found.name).toBe('Claude');
    expect(found.description).toBe('overworked');
    expect(found.createdAt).toBeInstanceOf(Date);
  });

  it('updates an agent', async () => {
    const saved = await agents.save(agents.create({ name: 'Pixel' }));
    await agents.update(saved.id, { description: 'brief keeps changing' });

    const found = await agents.findOneByOrFail({ id: saved.id });
    expect(found.description).toBe('brief keeps changing');
  });

  it('deletes an agent', async () => {
    const saved = await agents.save(agents.create({ name: 'Ada' }));
    await agents.delete(saved.id);
    expect(await agents.findOneBy({ id: saved.id })).toBeNull();
  });

  it('loads an agent together with its ailments', async () => {
    const agent = await agents.save(agents.create({ name: 'Claude' }));
    await ailments.save(ailments.create({ name: '2am pings', agent }));
    await ailments.save(ailments.create({ name: 'scope creep', agent }));

    const withAilments = await agents.findOneOrFail({
      where: { id: agent.id },
      relations: { ailments: true },
    });
    expect(withAilments.ailments.map((a) => a.name).sort()).toEqual([
      '2am pings',
      'scope creep',
    ]);
  });

  it('nulls out an ailment link when its agent is deleted', async () => {
    const agent = await agents.save(agents.create({ name: 'Claude' }));
    const ailment = await ailments.save(
      ailments.create({ name: '2am pings', agent }),
    );

    await agents.delete(agent.id);

    const orphan = await ailments.findOneOrFail({
      where: { id: ailment.id },
      relations: { agent: true },
    });
    expect(orphan.agent).toBeNull();
  });
});
