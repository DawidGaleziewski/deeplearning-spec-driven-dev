import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import type { CreateAilmentBody } from '@clinic/types';
import { Trim } from '../../common/transforms.js';

/** Body for `POST /ailments` (and, minus `agentId`, `POST /agents/:id/ailments`). */
export class CreateAilmentDto implements CreateAilmentBody {
  @Trim()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  /** Attach to an agent on creation; omit to log the complaint unattached. */
  @IsOptional()
  @IsUUID()
  agentId?: string | null;
}
