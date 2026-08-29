import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import type { UpdateAilmentBody } from '@clinic/types';
import { Trim } from '../../common/transforms.js';

/**
 * Body for `PATCH /ailments/:id`. Every field optional; send `agentId: null`
 * to detach the complaint from its agent.
 */
export class UpdateAilmentDto implements UpdateAilmentBody {
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsUUID()
  agentId?: string | null;
}
