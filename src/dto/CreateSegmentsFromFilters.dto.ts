import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateSegmentsFromFiltersDto {
  @IsArray()
  @IsInt({ each: true })
  @ArrayNotEmpty()
  actors: number[];

  @IsArray()
  @IsInt({ each: true })
  districts: number[];

  @IsArray()
  @IsInt({ each: true })
  blocks: number[];

  @IsArray()
  @IsInt({ each: true })
  schools: number[];

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
