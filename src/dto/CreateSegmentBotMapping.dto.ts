import { IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { v4 as uuid } from 'uuid';

export class CreateSegmentBotMappingDto {
  @IsInt()
  @IsNotEmpty()
  segmentId: bigint;

  @IsUUID()
  @IsNotEmpty()
  botId: uuid;
}

export class CreateSegmentBotMappingDtoV2 {
  @IsString()
  @IsNotEmpty()
  segmentId: string;

  @IsUUID()
  @IsNotEmpty()
  botId: uuid;
}
