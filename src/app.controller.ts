import { Body, Controller, Delete, Get, Param, Post, Query, SetMetadata, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateSegmentBotMappingDto, CreateSegmentBotMappingDtoV2 } from './dto/CreateSegmentBotMapping.dto';
import { DeleteSegmentBotMappingDto } from './dto/DeleteSegmentBotMapping.dto';

import { JwtAuthGuard } from './auth/auth-jwt.guard';
import { CreateSegmentDto } from './dto/CreateSegment.dto';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  getHealth(): string {
    return this.appService.getHealth();
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Post('/segment-bot-mapping')
  createSegmentBotMapping(@Body() dto: CreateSegmentBotMappingDto) {
    return this.appService.createSegmentBotMapping(dto);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Delete('/segment-bot-mapping')
  deleteSegmentBotMapping(@Query() dto: DeleteSegmentBotMappingDto) {
    return this.appService.deleteSegmentBotMapping(dto);
  }

  @Roles('Admin')
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

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('/segments/:id/mentors/count')
  getCountForSegment(
    @Param('id') segmentId: bigint,
  ) {
    return this.appService.getCountForSegment(segmentId);
  }

  @Get('/segments')
  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  getAllSegment() {
    return this.appService.getAllSegments();
  }

  @Post('/segment/phone')
  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  CreateSegmentAndMapping(@Body() body: CreateSegmentDto) {
    const { segment_name, segment_description, phone_numbers } = body;
    return this.appService.createSegmentAndMapping(
      segment_name,
      segment_description,
      phone_numbers,
    );
  }

  @Get('v2/segments/:ids/mentors/count')
  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  async getCountForSegmentV2(@Param('ids') segmentIdsParam: string) {
    const segmentIds: bigint[]= segmentIdsParam.split(",").map(id=> Number(id.trim()) as unknown as bigint)
    return await this.appService.getCountForSegmentV2(segmentIds);
  }

  @Get('v2/segments/:ids/mentors')
  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  async getMentorsForSegmentV2(
    @Param('ids') segmentIds: string,
    @Query('title') title: string,
    @Query('description') description: string,
    @Query('deepLink') deepLink: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const segmentsIds: bigint[] = segmentIds
      .split(',')
      .map((id) => Number(id.trim()) as unknown as bigint);

    return await this.appService.getMentorsForSegmentsV2(
      segmentsIds,
      title,
      description,
      deepLink,
      limit,
      offset,
    );
  }

  @Post('v2/segment-bot-mapping')
  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  async createSegmentBotMappingV2(@Body() dto: CreateSegmentBotMappingDtoV2) {
    return await this.appService.createSegmentBotMappingV2(dto);
  }
}
