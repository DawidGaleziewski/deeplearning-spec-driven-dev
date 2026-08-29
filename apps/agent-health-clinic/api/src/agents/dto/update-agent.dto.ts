import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { UpdateAgentBody } from '@clinic/types';
import { Trim } from '../../common/transforms.js';

/** Body for `PATCH /agents/:id` — every field optional, but present fields are validated. */
export class UpdateAgentDto implements UpdateAgentBody {
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}
