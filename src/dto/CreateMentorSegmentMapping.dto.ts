import { IsString, IsNotEmpty } from 'class-validator';

export class SegmentMentorMappingDto {
  @IsNotEmpty()
  @IsString()
  mentor_id: string;

  @IsNotEmpty()
  @IsString()
  segment_id: string;
}
