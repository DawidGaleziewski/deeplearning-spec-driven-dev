import type { DataSource, Repository } from 'typeorm';
import { createTestDataSource } from '../testing/test-data-source.js';
import { Agent } from '../entities/agent.entity.js';
import { Therapy } from '../entities/therapy.entity.js';
import { Booking } from '../entities/booking.entity.js';
import { BOOKING_STATUSES } from '../entities/booking-status.js';

describe('Booking repository', () => {
  let ds: DataSource;
  let agents: Repository<Agent>;
  let therapies: Repository<Therapy>;
  let bookings: Repository<Booking>;
  let agent: Agent;
  let therapy: Therapy;

  beforeEach(async () => {
    ds = await createTestDataSource();
    agents = ds.getRepository(Agent);
    therapies = ds.getRepository(Therapy);
    bookings = ds.getRepository(Booking);
    agent = await agents.save(agents.create({ name: 'Claude' }));
    therapy = await therapies.save(therapies.create({ name: 'Boundary Setting' }));
  });

  afterEach(async () => {
    await ds.destroy();
  });

  it('supports create / read / update / delete', async () => {
    const saved = await bookings.save(
      bookings.create({ agent, therapy, scheduledAt: new Date(), status: 'requested' }),
    );
    expect(saved.id).toBeTruthy();

    await bookings.update(saved.id, { status: 'confirmed' });
    expect((await bookings.findOneByOrFail({ id: saved.id })).status).toBe('confirmed');

    await bookings.delete(saved.id);
    expect(await bookings.findOneBy({ id: saved.id })).toBeNull();
  });

  it('resolves its agent and therapy relations', async () => {
    const saved = await bookings.save(
      bookings.create({ agent, therapy, scheduledAt: new Date() }),
    );
    const loaded = await bookings.findOneOrFail({
      where: { id: saved.id },
      relations: { agent: true, therapy: true },
    });
    expect(loaded.agent.id).toBe(agent.id);
    expect(loaded.therapy.id).toBe(therapy.id);
  });

  it('defaults status to "requested"', async () => {
    const saved = await bookings.save(
      bookings.create({ agent, therapy, scheduledAt: new Date() }),
    );
    expect((await bookings.findOneByOrFail({ id: saved.id })).status).toBe('requested');
  });

  it('accepts every defined status value', async () => {
    for (const status of BOOKING_STATUSES) {
      const saved = await bookings.save(
        bookings.create({ agent, therapy, scheduledAt: new Date(), status }),
      );
      expect((await bookings.findOneByOrFail({ id: saved.id })).status).toBe(status);
    }
  });

  it('rejects an invalid status value at the database level', async () => {
    await expect(
      bookings.save(
        bookings.create({
          agent,
          therapy,
          scheduledAt: new Date(),
          status: 'rescheduled' as never,
        }),
      ),
    ).rejects.toThrow();
  });

  it('is removed when its agent is deleted (cascade)', async () => {
    const saved = await bookings.save(
      bookings.create({ agent, therapy, scheduledAt: new Date() }),
    );
    await agents.delete(agent.id);
    expect(await bookings.findOneBy({ id: saved.id })).toBeNull();
  });
});
