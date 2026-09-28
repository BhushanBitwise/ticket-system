import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { RequestPriority } from '../schemas/request.schema';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(150)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  description: string;

  @IsMongoId()
  categoryId: string;

  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority;
}