import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AilmentResponse } from '@clinic/types';
import { Agent } from '../entities/agent.entity.js';
import { Ailment } from '../entities/ailment.entity.js';
import { toAilmentResponse } from '../common/serialization.js';
import { CreateAilmentDto } from './dto/create-ailment.dto.js';
import { UpdateAilmentDto } from './dto/update-ailment.dto.js';

const AILMENT_RELATIONS = { agent: true, recommendedTherapies: true } as const;

@Injectable()
export class AilmentsService {
  constructor(
    @InjectRepository(Ailment)
    private readonly ailments: Repository<Ailment>,
    @InjectRepository(Agent)
    private readonly agents: Repository<Agent>,
  ) {}

  async create(dto: CreateAilmentDto): Promise<AilmentResponse> {
    const ailment = this.ailments.create({
      name: dto.name,
      description: dto.description ?? null,
      agent: dto.agentId ? await this.resolveAgent(dto.agentId) : null,
    });
    const saved = await this.ailments.save(ailment);
    return this.findOne(saved.id);
  }

  async findAll(): Promise<AilmentResponse[]> {
    const ailments = await this.ailments.find({
      relations: AILMENT_RELATIONS,
      order: { createdAt: 'ASC' },
    });
    return ailments.map(toAilmentResponse);
  }

  async findOne(id: string): Promise<AilmentResponse> {
    return toAilmentResponse(await this.load(id));
  }

  async update(id: string, dto: UpdateAilmentDto): Promise<AilmentResponse> {
    const ailment = await this.load(id);
    if (dto.name !== undefined) ailment.name = dto.name;
    if (dto.description !== undefined) {
      ailment.description = dto.description ?? null;
    }
    if (dto.agentId === null) {
      ailment.agent = null;
    } else if (typeof dto.agentId === 'string') {
      ailment.agent = await this.resolveAgent(dto.agentId);
    }
    await this.ailments.save(ailment);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const { affected } = await this.ailments.delete(id);
    if (!affected) throw new NotFoundException(`Ailment ${id} not found`);
  }

  private async resolveAgent(agentId: string): Promise<Agent> {
    const agent = await this.agents.findOneBy({ id: agentId });
    if (!agent) throw new NotFoundException(`Agent ${agentId} not found`);
    return agent;
  }

  private async load(id: string): Promise<Ailment> {
    const ailment = await this.ailments.findOne({
      where: { id },
      relations: AILMENT_RELATIONS,
    });
    if (!ailment) throw new NotFoundException(`Ailment ${id} not found`);
    return ailment;
  }
}
