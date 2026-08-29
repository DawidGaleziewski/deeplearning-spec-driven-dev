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
import type { AilmentResponse } from '@clinic/types';
import { AilmentsService } from './ailments.service.js';
import { CreateAilmentDto } from './dto/create-ailment.dto.js';
import { UpdateAilmentDto } from './dto/update-ailment.dto.js';

/** REST surface for complaints, including ones not yet attached to an agent. */
@Controller('ailments')
export class AilmentsController {
  constructor(private readonly ailments: AilmentsService) {}

  @Post()
  create(@Body() dto: CreateAilmentDto): Promise<AilmentResponse> {
    return this.ailments.create(dto);
  }

  @Get()
  findAll(): Promise<AilmentResponse[]> {
    return this.ailments.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AilmentResponse> {
    return this.ailments.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAilmentDto,
  ): Promise<AilmentResponse> {
    return this.ailments.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.ailments.remove(id);
  }
}
