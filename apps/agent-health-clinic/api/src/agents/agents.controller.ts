import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import type { AgentResponse, AilmentResponse } from '@clinic/types';
import { AilmentsService } from '../ailments/ailments.service.js';
import { CreateAilmentDto } from '../ailments/dto/create-ailment.dto.js';
import { AgentsService } from './agents.service.js';
import { CreateAgentDto } from './dto/create-agent.dto.js';
import { UpdateAgentDto } from './dto/update-agent.dto.js';

/** REST surface for the clinic's "patients" and their complaints. */
@Controller('agents')
export class AgentsController {
  constructor(
    private readonly agents: AgentsService,
    private readonly ailments: AilmentsService,
  ) {}

  @Post()
  create(@Body() dto: CreateAgentDto): Promise<AgentResponse> {
    return this.agents.create(dto);
  }

  @Get()
  findAll(): Promise<AgentResponse[]> {
    return this.agents.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgentResponse> {
    return this.agents.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgentDto,
  ): Promise<AgentResponse> {
    return this.agents.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.agents.remove(id);
  }

  /** Log a complaint already attached to this agent — the check-in "add" action. */
  @Post(':id/ailments')
  addAilment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAilmentDto,
  ): Promise<AilmentResponse> {
    return this.ailments.create({ ...dto, agentId: id });
  }
}
