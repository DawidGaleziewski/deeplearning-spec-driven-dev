import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Agent } from '../entities/agent.entity.js';
import { Ailment } from '../entities/ailment.entity.js';
import { Therapy } from '../entities/therapy.entity.js';
import { Booking } from '../entities/booking.entity.js';
import { BOOKING_STATUSES, type BookingStatus } from '../entities/booking-status.js';

/**
 * Disposable manual-testing surface for Phase 1. Thin passthroughs to the
 * repositories plus one static HTML page — NOT the Phase 3+ REST API. Registered
 * only outside production (see {@link DevModule}).
 */
@Controller('dev')
export class DevController {
  constructor(
    @InjectRepository(Agent) private readonly agents: Repository<Agent>,
    @InjectRepository(Ailment) private readonly ailments: Repository<Ailment>,
    @InjectRepository(Therapy) private readonly therapies: Repository<Therapy>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
  ) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  page(): string {
    return readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf-8');
  }

  // --- Agents ---------------------------------------------------------------

  @Get('agents')
  listAgents(): Promise<Agent[]> {
    return this.agents.find({
      relations: { ailments: true },
      order: { createdAt: 'ASC' },
    });
  }

  @Post('agents')
  createAgent(
    @Body() body: { name?: string; description?: string },
  ): Promise<Agent> {
    if (!body?.name) throw new BadRequestException('name is required');
    return this.agents.save(
      this.agents.create({ name: body.name, description: body.description ?? null }),
    );
  }

  // --- Ailments ------------------------------------------------------------

  @Get('ailments')
  listAilments(): Promise<Ailment[]> {
    return this.ailments.find({
      relations: { agent: true, recommendedTherapies: true },
      order: { createdAt: 'ASC' },
    });
  }

  @Post('ailments')
  createAilment(
    @Body() body: { name?: string; description?: string; agentId?: string },
  ): Promise<Ailment> {
    if (!body?.name) throw new BadRequestException('name is required');
    return this.ailments.save(
      this.ailments.create({
        name: body.name,
        description: body.description ?? null,
        agent: body.agentId ? ({ id: body.agentId } as Agent) : null,
      }),
    );
  }

  // --- Therapies ----------------------------------------------------------

  @Get('therapies')
  listTherapies(): Promise<Therapy[]> {
    return this.therapies.find({
      relations: { ailments: true },
      order: { createdAt: 'ASC' },
    });
  }

  @Post('therapies')
  createTherapy(
    @Body()
    body: {
      name?: string;
      description?: string;
      format?: string;
      durationMinutes?: number | string;
    },
  ): Promise<Therapy> {
    if (!body?.name) throw new BadRequestException('name is required');
    const duration =
      body.durationMinutes === undefined || body.durationMinutes === ''
        ? null
        : Number(body.durationMinutes);
    return this.therapies.save(
      this.therapies.create({
        name: body.name,
        description: body.description ?? null,
        format: body.format ?? null,
        durationMinutes: duration,
      }),
    );
  }

  // --- Bookings ---------------------------------------------------------

  @Get('bookings')
  listBookings(): Promise<Booking[]> {
    return this.bookings.find({
      relations: { agent: true, therapy: true },
      order: { createdAt: 'ASC' },
    });
  }

  @Post('bookings')
  async createBooking(
    @Body()
    body: {
      agentId?: string;
      therapyId?: string;
      scheduledAt?: string;
      status?: string;
    },
  ): Promise<Booking> {
    if (!body?.agentId || !body?.therapyId) {
      throw new BadRequestException('agentId and therapyId are required');
    }
    const status = (body.status ?? 'requested') as BookingStatus;
    if (!BOOKING_STATUSES.includes(status)) {
      throw new BadRequestException(
        `status must be one of: ${BOOKING_STATUSES.join(', ')}`,
      );
    }
    const agent = await this.agents.findOneBy({ id: body.agentId });
    if (!agent) throw new NotFoundException(`agent ${body.agentId} not found`);
    const therapy = await this.therapies.findOneBy({ id: body.therapyId });
    if (!therapy) {
      throw new NotFoundException(`therapy ${body.therapyId} not found`);
    }
    return this.bookings.save(
      this.bookings.create({
        agent,
        therapy,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
        status,
      }),
    );
  }

  // --- Relationship helpers -------------------------------------------

  @Post('agents/:id/ailments')
  async attachAilment(
    @Param('id') agentId: string,
    @Body() body: { ailmentId?: string },
  ): Promise<Ailment> {
    if (!body?.ailmentId) throw new BadRequestException('ailmentId is required');
    const agent = await this.agents.findOneBy({ id: agentId });
    if (!agent) throw new NotFoundException(`agent ${agentId} not found`);
    const ailment = await this.ailments.findOneBy({ id: body.ailmentId });
    if (!ailment) {
      throw new NotFoundException(`ailment ${body.ailmentId} not found`);
    }
    ailment.agent = agent;
    return this.ailments.save(ailment);
  }

  @Post('ailments/:id/therapies')
  async attachTherapies(
    @Param('id') ailmentId: string,
    @Body() body: { therapyId?: string; therapyIds?: string[] },
  ): Promise<Ailment> {
    const ids = body?.therapyIds ?? (body?.therapyId ? [body.therapyId] : []);
    if (ids.length === 0) {
      throw new BadRequestException('therapyId or therapyIds is required');
    }
    const ailment = await this.ailments.findOne({
      where: { id: ailmentId },
      relations: { recommendedTherapies: true },
    });
    if (!ailment) throw new NotFoundException(`ailment ${ailmentId} not found`);
    const therapies = await this.therapies.findBy({ id: In(ids) });
    if (therapies.length !== ids.length) {
      throw new NotFoundException('one or more therapies not found');
    }
    const existing = new Set(ailment.recommendedTherapies.map((t) => t.id));
    ailment.recommendedTherapies.push(
      ...therapies.filter((t) => !existing.has(t.id)),
    );
    return this.ailments.save(ailment);
  }
}
