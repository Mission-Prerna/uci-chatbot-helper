import { IsNotEmpty, IsString } from 'class-validator';

export class GetSegmentFiltersDto {
  @IsString()
  @IsNotEmpty()
  actors: string = '-1';

  @IsString()
  @IsNotEmpty()
  districts: string = '-1';

  @IsString()
  @IsNotEmpty()
  blocks: string = '-1';
}
