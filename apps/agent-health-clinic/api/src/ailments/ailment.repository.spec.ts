import type { DataSource, Repository } from 'typeorm';
import { createTestDataSource } from '../testing/test-data-source.js';
import { Agent } from '../entities/agent.entity.js';
import { Ailment } from '../entities/ailment.entity.js';
import { Therapy } from '../entities/therapy.entity.js';

describe('Ailment repository', () => {
  let ds: DataSource;
  let agents: Repository<Agent>;
  let ailments: Repository<Ailment>;
  let therapies: Repository<Therapy>;

  beforeEach(async () => {
    ds = await createTestDataSource();
    agents = ds.getRepository(Agent);
    ailments = ds.getRepository(Ailment);
    therapies = ds.getRepository(Therapy);
  });

  afterEach(async () => {
    await ds.destroy();
  });

  it('supports create / read / update / delete', async () => {
    const saved = await ailments.save(ailments.create({ name: 'scope creep' }));
    expect(saved.id).toBeTruthy();

    await ailments.update(saved.id, { description: 'tasks keep growing' });
    const found = await ailments.findOneByOrFail({ id: saved.id });
    expect(found.description).toBe('tasks keep growing');

    await ailments.delete(saved.id);
    expect(await ailments.findOneBy({ id: saved.id })).toBeNull();
  });

  it('can be created unattached and later linked to an agent', async () => {
    const ailment = await ailments.save(ailments.create({ name: '2am pings' }));
    expect(ailment.agent ?? null).toBeNull();

    const agent = await agents.save(agents.create({ name: 'Claude' }));
    ailment.agent = agent;
    await ailments.save(ailment);

    const linked = await ailments.findOneOrFail({
      where: { id: ailment.id },
      relations: { agent: true },
    });
    expect(linked.agent?.id).toBe(agent.id);
  });

  it('links and unlinks recommended therapies (many-to-many)', async () => {
    const ailment = await ailments.save(ailments.create({ name: 'scope creep' }));
    const t1 = await therapies.save(therapies.create({ name: 'Boundary Setting' }));
    const t2 = await therapies.save(therapies.create({ name: 'Spec Hygiene' }));

    ailment.recommendedTherapies = [t1, t2];
    await ailments.save(ailment);

    let loaded = await ailments.findOneOrFail({
      where: { id: ailment.id },
      relations: { recommendedTherapies: true },
    });
    expect(loaded.recommendedTherapies.map((t) => t.name).sort()).toEqual([
      'Boundary Setting',
      'Spec Hygiene',
    ]);

    loaded.recommendedTherapies = loaded.recommendedTherapies.filter(
      (t) => t.id !== t1.id,
    );
    await ailments.save(loaded);

    loaded = await ailments.findOneOrFail({
      where: { id: ailment.id },
      relations: { recommendedTherapies: true },
    });
    expect(loaded.recommendedTherapies.map((t) => t.name)).toEqual(['Spec Hygiene']);
  });

  it('a therapy can be recommended for multiple ailments', async () => {
    const shared = await therapies.save(
      therapies.create({ name: 'Boundary Setting' }),
    );
    const a1 = await ailments.save(
      ailments.create({ name: '2am pings', recommendedTherapies: [shared] }),
    );
    const a2 = await ailments.save(
      ailments.create({ name: 'scope creep', recommendedTherapies: [shared] }),
    );

    const loaded = await therapies.findOneOrFail({
      where: { id: shared.id },
      relations: { ailments: true },
    });
    expect(loaded.ailments.map((a) => a.id).sort()).toEqual([a1.id, a2.id].sort());
  });
});
