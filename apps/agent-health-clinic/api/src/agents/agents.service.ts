import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AgentResponse } from '@clinic/types';
import { Agent } from '../entities/agent.entity.js';
import { toAgentResponse } from '../common/serialization.js';
import { CreateAgentDto } from './dto/create-agent.dto.js';
import { UpdateAgentDto } from './dto/update-agent.dto.js';

/** Full relation graph the check-in UI needs for one agent. */
const AGENT_RELATIONS = {
  ailments: { recommendedTherapies: true, agent: true },
} as const;

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agents: Repository<Agent>,
  ) {}

  async create(dto: CreateAgentDto): Promise<AgentResponse> {
    const saved = await this.agents.save(
      this.agents.create({
        name: dto.name,
        description: dto.description ?? null,
      }),
    );
    return this.findOne(saved.id);
  }

  async findAll(): Promise<AgentResponse[]> {
    const agents = await this.agents.find({
      relations: AGENT_RELATIONS,
      order: { createdAt: 'ASC' },
    });
    return agents.map(toAgentResponse);
  }

  async findOne(id: string): Promise<AgentResponse> {
    return toAgentResponse(await this.load(id));
  }

  async update(id: string, dto: UpdateAgentDto): Promise<AgentResponse> {
    const agent = await this.load(id);
    if (dto.name !== undefined) agent.name = dto.name;
    if (dto.description !== undefined) agent.description = dto.description ?? null;
    await this.agents.save(agent);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    // Hard delete. The DB's `ON DELETE SET NULL` detaches this agent's
    // ailments rather than removing them (the complaint history is real data).
    const { affected } = await this.agents.delete(id);
    if (!affected) throw this.notFound(id);
  }

  private async load(id: string): Promise<Agent> {
    const agent = await this.agents.findOne({
      where: { id },
      relations: AGENT_RELATIONS,
    });
    if (!agent) throw this.notFound(id);
    return agent;
  }

  private notFound(id: string): NotFoundException {
    return new NotFoundException(`Agent ${id} not found`);
  }
}
