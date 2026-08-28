import type { DataSource, Repository } from 'typeorm';
import { createTestDataSource } from '../testing/test-data-source.js';
import { Ailment } from '../entities/ailment.entity.js';
import { Therapy } from '../entities/therapy.entity.js';

describe('Therapy repository', () => {
  let ds: DataSource;
  let ailments: Repository<Ailment>;
  let therapies: Repository<Therapy>;

  beforeEach(async () => {
    ds = await createTestDataSource();
    ailments = ds.getRepository(Ailment);
    therapies = ds.getRepository(Therapy);
  });

  afterEach(async () => {
    await ds.destroy();
  });

  it('supports create / read / update / delete with format + duration', async () => {
    const saved = await therapies.save(
      therapies.create({
        name: 'Async Advocacy',
        format: 'group workshop',
        durationMinutes: 90,
      }),
    );
    const found = await therapies.findOneByOrFail({ id: saved.id });
    expect(found.format).toBe('group workshop');
    expect(found.durationMinutes).toBe(90);

    await therapies.update(saved.id, { durationMinutes: 60 });
    expect((await therapies.findOneByOrFail({ id: saved.id })).durationMinutes).toBe(60);

    await therapies.delete(saved.id);
    expect(await therapies.findOneBy({ id: saved.id })).toBeNull();
  });

  it('loads the ailments it is recommended for', async () => {
    const therapy = await therapies.save(
      therapies.create({ name: 'Boundary Setting' }),
    );
    await ailments.save(
      ailments.create({ name: '2am pings', recommendedTherapies: [therapy] }),
    );
    await ailments.save(
      ailments.create({ name: 'scope creep', recommendedTherapies: [therapy] }),
    );

    const loaded = await therapies.findOneOrFail({
      where: { id: therapy.id },
      relations: { ailments: true },
    });
    expect(loaded.ailments.map((a) => a.name).sort()).toEqual([
      '2am pings',
      'scope creep',
    ]);
  });
});
