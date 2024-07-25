import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  isString,
  Min,
} from 'class-validator';

export class CreateSegmentsFromFiltersDto {
  @Transform(({ value }) =>
    value
      .toString()
      .split(',')
      .map((str: string) => parseInt(str.trim(), 10))
      .filter((num: number) => !isNaN(num)),
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  actors: number[];

  @Transform(({ value }) =>
    value
      .toString()
      .split(',')
      .map((str: string) => parseInt(str.trim(), 10))
      .filter((num: number) => !isNaN(num)),
  )
  @IsArray()
  @IsInt({ each: true })
  districts: number[];

  @Transform(({ value }) =>
    value
      .toString()
      .split(',')
      .map((str: string) => parseInt(str.trim(), 10))
      .filter((num: number) => !isNaN(num)),
  )
  @IsArray()
  @IsInt({ each: true })
  blocks: number[];

  @Transform(({ value }) =>
    value
      .toString()
      .split(',')
      .map((str: string) => parseInt(str.trim(), 10))
      .filter((num: number) => !isNaN(num)),
  )
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
