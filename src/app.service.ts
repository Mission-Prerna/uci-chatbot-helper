import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  CreateSegmentBotMappingDto,
  CreateSegmentBotMappingDtoV2,
} from './dto/CreateSegmentBotMapping.dto';
import { DeleteSegmentBotMappingDto } from './dto/DeleteSegmentBotMapping.dto';
import { SegmentMentorMappingDto } from './dto/CreateMentorSegmentMapping.dto';
import { GetSegmentFiltersDto } from './dto/GetSegmentFilters.dto';
import { CreateSegmentsFromFiltersDto } from './dto/CreateSegmentsFromFilters.dto';
import { ActorEnum } from './utils/enums';
import { getPrismaErrorStatusAndMessage } from './utils/utils';

@Injectable()
export class AppService {
  protected readonly logger = new Logger(AppService.name);

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
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(
        `Error creating segment bot mapping:- ${errorMessage}`,
        error,
      );

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
      );
    }
  }

  async deleteSegmentBotMapping(data: DeleteSegmentBotMappingDto) {
    try {
      const result = await this.prisma.segment_bots.deleteMany({
        where: { bot_id: { in: data.bot_ids } },
      });
      return { affected_rows: result.count };
    } catch (error) {
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(
        `Error deleting segment bot mapping:- ${errorMessage}`,
        error,
      );

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
      );
    }
  }

  async getMentorsForSegment(
    segmentId: bigint,
    title: string,
    description: string,
    deepLink: string,
    limit: number = 100000,
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
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(
        `Error fetching mentors for segment:- ${errorMessage}`,
        error,
      );

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
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
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(
        `Error fetching count for segment:- ${errorMessage}`,
        error,
      );

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
      );
    }
  }

  async getCountForSegmentV2(segmentIds: bigint[]) {
    const totalCount = { totalCount: 0, segment_id: {} };

    try {
      for (const segmentId of segmentIds) {
        const count = await this.prisma.mentor.count({
          where: {
            mentor_segmentation: { some: { segment_id: segmentId } },
            mentor_tokens: { token: { not: '' } },
          },
        });
        totalCount.segment_id[segmentId.toString()] = count; // Ensure the segment_id keys are strings
        totalCount.totalCount += count;
      }

      return totalCount;
    } catch (error) {
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(
        `Error fetching counts for segments:- ${errorMessage}`,
        error,
      );

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
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
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(`Error fetching all segments:- ${errorMessage}`, error);

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
      );
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
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(
        `Error creating segment and mapping:- ${errorMessage}`,
        error,
      );

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
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
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(`Error creating segment:- ${errorMessage}`, error);

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
      );
    }
  }

  async fetchMentorIds(phoneNumbers: string[]) {
    try {
      const mentors = await this.prisma.mentor.findMany({
        where: { phone_no: { in: phoneNumbers } },
      });
      return mentors;
    } catch (error) {
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(`Error fetching mentor IDs:- ${errorMessage}`, error);

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
      );
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
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(`Error creating mappings:- ${errorMessage}`, error);

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
      );
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
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(
        `Error creating segment bot mapping V2:- ${errorMessage}`,
        error,
      );

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
      );
    }
  }

  async getMentorsForSegmentsV2(
    segmentIds: bigint[],
    title: string,
    description: string,
    deepLink: string,
    limit: number = 100000,
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
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(
        `Error fetching mentors for segments V2:- ${errorMessage}`,
        error,
      );

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
      );
    }
  }

  async getSegmentFilters(query: GetSegmentFiltersDto) {
    try {
      const { actors, blocks, districts } = query;
      const actorIds = actors.split(',').map((id) => Number(id.trim()));
      const districtIds = districts.split(',').map((id) => Number(id.trim()));
      const blockIds = blocks.split(',').map((id) => Number(id.trim()));

      const response = {
        actors: [],
        districts: [],
        blocks: [],
        schools: [],
      };

      response.actors = await this.getActors();

      if (actorIds.length > 0 && actorIds[0] !== -1)
        response.districts = await this.getDistrictByActorIds(actorIds);

      if (districtIds.length > 0 && districtIds[0] !== -1)
        response.blocks = await this.getBlocksByDistrictIds(districtIds);

      if (blockIds.length > 0 && blockIds[0] !== -1)
        response.schools = await this.getSchoolByDistrictAndBlock(
          districtIds,
          blockIds,
        );

      return response;
    } catch (error) {
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(
        `Error fetching segment filters:- ${errorMessage}`,
        error,
      );

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
      );
    }
  }

  async getActors() {
    const actors = await this.prisma.actors.findMany();
    return actors.map((actor) => ({
      id: actor.id,
      label: actor.name,
    }));
  }

  async getDistrictByActorIds(actorIds: number[]) {
    const mentorDistrict = await this.prisma.mentor.findMany({
      where: { actor_id: { in: actorIds } },
      distinct: ['district_id'], // Ensure that district IDs are unique
      select: {
        district_id: true,
        districts: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      orderBy: {
        district_id: 'asc',
      },
    });

    // Extract district names and ids from the result
    return mentorDistrict.map((district) => {
      return { id: district.districts.id, label: district.districts.name };
    });
  }

  async getBlocksByDistrictIds(districtIds: number[]) {
    const blocks = await this.prisma.blocks.findMany({
      where: { district_id: { in: districtIds } },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: 'asc', // Sort by district_id in ascending order
      },
    });

    // Transform the results to include id and label
    return blocks.map((block) => ({
      id: block.id,
      label: block.name,
    }));
  }

  async getSchoolByDistrictAndBlock(districtIds: number[], blockIds: number[]) {
    let whereCondition: any = {};

    if (districtIds.length > 0 && districtIds[0] !== -1) {
      whereCondition = { ...whereCondition, district_id: { in: districtIds } };
    }

    if (blockIds.length > 0 && blockIds[0] !== -1) {
      whereCondition = { ...whereCondition, block_id: { in: blockIds } };
    }

    const schools = await this.prisma.school_list.findMany({
      where: whereCondition,
      select: {
        udise: true,
        name: true,
      },
    });

    return schools.map((school) => ({
      id: school.udise,
      label: school.name,
    }));
  }

  async createSegmentsFilter(body: CreateSegmentsFromFiltersDto) {
    try {
      const { actors, blocks, description, districts, name, schools } = body;
      let actorIds = actors;

      // Check if actors array is empty
      if (!actorIds || actorIds.length === 0) {
        throw new BadRequestException(
          'Actors are compulsory and should not be empty.',
        );
      }

      const whereCondition: any = {};

      if (districts && districts.length > 0) {
        whereCondition.district_id = { in: districts };
      }

      if (blocks && blocks.length > 0) {
        whereCondition.block_id = { in: blocks };
      }

      let mentors = [];

      if (
        actorIds.includes(ActorEnum.TEACHER) &&
        schools &&
        schools.length > 0
      ) {
        // Special case when actor is  teacher and schools (udise) are not empty
        whereCondition.actor_id = ActorEnum.TEACHER;
        const teachers = await this.prisma.mentor.findMany({
          where: {
            AND: [
              whereCondition,
              {
                teacher_school_list_mapping: {
                  some: {
                    school_list: {
                      udise: { in: schools },
                    },
                  },
                },
              },
            ],
          },
          select: {
            phone_no: true,
            id: true,
          },
        });

        mentors.push(...teachers);
        // filter out teacher from actors
        actorIds = actorIds.filter((actor) => actor !== 3);
      }
      // Default case if actors are not empty
      if (actorIds.length > 0) {
        whereCondition.actor_id = { in: actorIds };
        const otherMentors = await this.prisma.mentor.findMany({
          where: whereCondition,
          select: {
            phone_no: true,
            id: true,
          },
        });
        mentors.push(...otherMentors);
      }

      // create segment
      const segment = await this.prisma.segments.create({
        data: {
          description,
          name,
        },
      });

      // map segment with mentors
      const mentorSegmentMappings = mentors.map((mentor) => ({
        phone_no: mentor.phone_no,
        mentor_id: `${mentor.id}`,
        segment_id: `${segment.id}`,
      }));

      await this.createMappings(mentorSegmentMappings);

      return segment;
    } catch (error) {
      const { errorMessage, statusCode } =
        getPrismaErrorStatusAndMessage(error);
      this.logger.error(
        `Error creating segment and mentor mapping by segment filter:- ${errorMessage}`,
        error,
      );

      throw new HttpException(
        {
          error_message: errorMessage,
          error_code: statusCode,
        },
        statusCode,
      );
    }
  }
}
