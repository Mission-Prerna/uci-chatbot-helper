import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString
} from 'class-validator';

export class CreateSegmentDto {
  @IsNotEmpty()
  @IsString()
  segment_name: string;

  @IsNotEmpty()
  @IsString()
  segment_description: string;

  @IsArray()
  @IsNotEmpty()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  phone_numbers: string[];
}
