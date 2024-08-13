import { Transform, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteSegmentBotMappingDto {
  @IsArray()
  @IsUUID('all', { each: true })
  @Type(() => IsUUID)
  @IsNotEmpty()
  @Transform(({ value }) => {
    const botIds = value.split(',');
    return botIds.map((botId: string) => botId.trim());
  })
  bot_ids?: string[];
}
