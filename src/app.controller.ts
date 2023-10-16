import { Body, Controller, Delete, Get, Param, Post, Query, SetMetadata, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateSegmentBotMappingDto } from './dto/CreateSegmentBotMapping.dto';
import { DeleteSegmentBotMappingDto } from './dto/DeleteSegmentBotMapping.dto';

import { JwtAuthGuard } from './auth/auth-jwt.guard';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

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

  @Roles('OpenRole')
  @UseGuards(JwtAuthGuard)
  @Delete('/segment-bot-mapping')
  deleteSegmentBotMapping(@Query() dto: DeleteSegmentBotMappingDto) {
    return this.appService.deleteSegmentBotMapping(dto);
  }

  @Roles('OpenRole')
  @UseGuards(JwtAuthGuard)
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

  @Get('/segments/:id/mentors/count')
  getCountForSegment(
    @Param('id') segmentId: bigint,
  ) {
    return this.appService.getCountForSegment(segmentId);
  }
}
