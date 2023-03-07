import { IsInt, IsNotEmpty, IsUUID } from 'class-validator';
import { v4 as uuid } from 'uuid';

export class CreateSegmentBotMappingDto {
  @IsInt()
  @IsNotEmpty()
  segmentId: bigint;

  @IsUUID()
  @IsNotEmpty()
  botId: uuid;
}
