import { Transform, Type } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';

export class DeleteSegmentBotMappingDto {
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.split(','))
  bot_ids?: string[];
}
