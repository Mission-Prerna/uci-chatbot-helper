import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateSegmentBotMappingDto } from './dto/CreateSegmentBotMapping.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  getHealth(): string {
    return this.appService.getHealth();
  }

  @Post('/segment-bot-mapping')
  createSegmentBotMapping(@Body() dto: CreateSegmentBotMappingDto) {
    return this.appService.createSegmentBotMapping(dto);
  }

  @Get('/segments/:id/mentors')
  getMentorsForSegment(
    @Param('id') segmentId: bigint,
    @Query('title') title: string,
    @Query('description') description: string,
    @Query('deepLink') deepLink: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.appService.getMentorsForSegment(segmentId, title, description, deepLink, limit, offset);
  }
}
