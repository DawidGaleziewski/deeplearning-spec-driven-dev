import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { CreateAgentBody } from '@clinic/types';
import { Trim } from '../../common/transforms.js';

/** Body for `POST /agents`. */
export class CreateAgentDto implements CreateAgentBody {
  @Trim()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}
