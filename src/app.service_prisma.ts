import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  CreateSegmentBotMappingDto,
  CreateSegmentBotMappingDtoV2,
} from './dto/CreateSegmentBotMapping.dto';
import { DeleteSegmentBotMappingDto } from './dto/DeleteSegmentBotMapping.dto';
import { SegmentMentorMappingDto } from './dto/CreateMentorSegmentMapping.dto';

@Injectable()
export class AppServiceWithPrisma {
  protected readonly logger = new Logger(AppServiceWithPrisma.name);

  constructor(private readonly prisma: PrismaService) {}

  getHealth(): string {
    return 'OK';
  }

  async createSegmentBotMapping(data: CreateSegmentBotMappingDto) {
    try {
      const result = await this.prisma.segment_bots.upsert({
        where: {
          segment_id_bot_id: { segment_id: data.segmentId, bot_id: data.botId },
        },
        update: { bot_id: data.botId },
        create: { segment_id: data.segmentId, bot_id: data.botId },
      });
      return result;
    } catch (error) {
      this.logger.error('Error creating segment bot mapping:', error);
      throw new InternalServerErrorException(
        'Error creating segment bot mapping',
      );
    }
  }

  async deleteSegmentBotMapping(data: DeleteSegmentBotMappingDto) {
    try {
      const result = await this.prisma.segment_bots.deleteMany({
        where: { bot_id: { in: data.bot_ids.split(',') } },
      });
      return { affected_rows: result.count };
    } catch (error) {
      this.logger.error('Error deleting segment bot mapping:', error);
      throw new InternalServerErrorException(
        'Error deleting segment bot mapping',
      );
    }
  }

  async getMentorsForSegment(
    segmentId: bigint,
    title: string,
    description: string,
    deepLink: string,
    limit: number = 200000,
    offset: number = 0,
  ) {
    try {
      const mentors = await this.prisma.mentor.findMany({
        where: {
          mentor_segmentation: {
            some: {
              segment_id: segmentId,
            },
          },
          mentor_tokens: {
            token: {
              not: '',
            },
          },
        },
        take: Number(limit), // Ensure 'take' is correctly typed as number or bigint
        skip: Number(offset),
        orderBy: {
          id: 'asc',
        },
        include: {
          mentor_tokens: true,
        },
      });

      const finalData = mentors.map((mentor) => ({
        fcmToken: mentor?.mentor_tokens?.token,
        phoneNo: mentor.phone_no,
        name: mentor.officer_name,
        title: title,
        description: description,
        fcmClickActionUrl: deepLink,
      }));

      return { data: finalData };
    } catch (error) {
      this.logger.error('Error fetching mentors for segment:', error);
      throw new InternalServerErrorException(
        'Error fetching mentors for segment',
      );
    }
  }

  async getCountForSegment(segmentId: bigint) {
    try {
      const count = await this.prisma.mentor.count({
        where: {
          mentor_segmentation: { some: { segment_id: segmentId } },
          mentor_tokens: { token: { not: '' } },
        },
      });
      return { totalCount: count };
    } catch (error) {
      this.logger.error('Error fetching count for segment:', error);
      throw new InternalServerErrorException(
        'Error fetching count for segment',
      );
    }
  }

  async getCountForSegmentV2(segmentIds: bigint[]) {
    const totalCounts = { totalCounts: 0, segment_id: {} };

    try {
      for (const segmentId of segmentIds) {
        const count = await this.prisma.mentor.count({
          where: {
            mentor_segmentation: { some: { segment_id: segmentId } },
            mentor_tokens: { token: { not: '' } },
          },
        });
        totalCounts.segment_id[segmentId.toString()] = count; // Ensure the segment_id keys are strings
        totalCounts.totalCounts += count;
      }

      return totalCounts;
    } catch (error) {
      this.logger.error('Error fetching counts for segments:', error);
      throw new InternalServerErrorException(
        'Error fetching counts for segments',
      );
    }
  }

  async getAllSegments() {
    try {
      const segments = await this.prisma.segments.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          created_at: true,
          updated_at: true,
        },
      });

      return segments;
    } catch (error) {
      this.logger.error('Error fetching all segments:', error);
      throw new InternalServerErrorException('Error fetching all segments');
    }
  }

  async createSegmentAndMapping(
    segmentName: string,
    segmentDescription: string,
    phoneNumbers: string[],
  ) {
    try {
      let [segmentResult, mentors] = await Promise.all([
        this.createSegment(segmentName, segmentDescription),
        this.fetchMentorIds(phoneNumbers),
      ]);

      const mentorSegmentMappings: SegmentMentorMappingDto[] = mentors.map(
        (mentor) => ({
          mentor_id: `${mentor.id}`,
          segment_id: `${segmentResult.id}`,
          phone_no: mentor.phone_no,
        }),
      );

      const mappingsResult = await this.createMappings(mentorSegmentMappings);

      return {
        count: mappingsResult,
        segment: { ...segmentResult, id: Number(segmentResult.id) },
        mentorsMappedWithSegment: mentorSegmentMappings,
      };
    } catch (error) {
      this.logger.error('Error creating segment and mapping:', error);
      throw new InternalServerErrorException(
        'Error creating segment and mapping',
      );
    }
  }

  async createSegment(segmentName: string, segmentDescription: string) {
    try {
      const result = await this.prisma.segments.create({
        data: { name: segmentName, description: segmentDescription },
      });
      return result;
    } catch (error) {
      this.logger.error('Error creating segment:', error);
      throw new InternalServerErrorException('Error creating segment');
    }
  }

  async fetchMentorIds(phoneNumbers: string[]) {
    try {
      const mentors = await this.prisma.mentor.findMany({
        where: { phone_no: { in: phoneNumbers } },
      });
      return mentors;
    } catch (error) {
      this.logger.error('Error fetching mentor IDs:', error);
      throw new InternalServerErrorException('Error fetching mentor IDs');
    }
  }

  async createMappings(mentorSegmentMappings: SegmentMentorMappingDto[]) {
    try {
      const result = await this.prisma.mentor_segmentation.createMany({
        data: mentorSegmentMappings.map((mapping) => ({
          mentor_id: Number(mapping.mentor_id),
          segment_id: Number(mapping.segment_id),
        })),
      });
      return result.count;
    } catch (error) {
      this.logger.error('Error creating mappings:', error);
      throw new InternalServerErrorException('Error creating mappings');
    }
  }

  async createSegmentBotMappingV2(data: CreateSegmentBotMappingDtoV2) {
    const segmentBotMappings = data.segmentId.split(',').map((id) => ({
      segment_id: Number(id.trim()),
      bot_id: data.botId,
    }));

    try {
      const result = await this.prisma.segment_bots.createMany({
        data: segmentBotMappings,
      });
      return result;
    } catch (error) {
      this.logger.error('Error creating segment bot mapping V2:', error);
      throw new InternalServerErrorException(
        'Error creating segment bot mapping V2',
      );
    }
  }

  async getMentorsForSegmentsV2(
    segmentIds: bigint[],
    title: string,
    description: string,
    deepLink: string,
    limit: number = 200000,
    offset: number = 0,
  ) {
    try {
      const mentors = await this.prisma.mentor.findMany({
        where: {
          mentor_segmentation: {
            some: {
              segment_id: { in: segmentIds },
            },
          },
          mentor_tokens: {
            token: { not: '' },
          },
        },
        select: {
          phone_no: true,
          officer_name: true,
          mentor_tokens: {
            select: {
              token: true,
            },
          },
        },
        take: Number(limit),
        skip: Number(offset),
        orderBy: {
          id: 'asc',
        },
      });

      const finalData = mentors.map((mentor) => ({
        fcmToken: mentor.mentor_tokens.token,
        phoneNo: mentor.phone_no,
        name: mentor.officer_name,
        title: title,
        description: description,
        fcmClickActionUrl: deepLink,
      }));

      return { data: finalData };
    } catch (error) {
      this.logger.error('Error fetching mentors for segments V2:', error);
      throw new InternalServerErrorException(
        'Error fetching mentors for segments V2',
      );
    }
  }
}
