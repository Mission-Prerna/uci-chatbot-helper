import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';
import { CreateSegmentBotMappingDto, CreateSegmentBotMappingDtoV2 } from './dto/CreateSegmentBotMapping.dto';
import { DeleteSegmentBotMappingDto } from './dto/DeleteSegmentBotMapping.dto';
import { SegmentMentorMappingDto } from './dto/CreateMentorSegmentMapping.dto';

@Injectable()
export class AppService {
  private readonly hasuraGraphqlUrl;
  private readonly hasuraGraphqlSecret;

  protected readonly logger = new Logger(AppService.name); // logger instance

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.hasuraGraphqlUrl = configService.get<string>('HASURA_GRAPHQL_URL');
    this.hasuraGraphqlSecret = configService.get<string>('HASURA_ADMIN_SECRET');
  }

  getHealth(): string {
    return 'OK';
  }

  async hasuraGraphQLCall(
    data,
    url: string = this.hasuraGraphqlUrl,
    headers = {
      'x-hasura-admin-secret': this.hasuraGraphqlSecret,
      'Content-Type': 'application/json',
    },
  ) {
    return await lastValueFrom(
      this.httpService
        .post(url, data, {
          headers: headers,
        })
        .pipe(
          map((res) => {
            const error = res?.data?.errors
            if (error) {
              // log the error globally & throw 500
              this.logger.error('GraphQl Errors:', error);
              throw new InternalServerErrorException(null, error?.[0]?.message || 'GraphQl Error occurred.');
            }
            return res.status == 200 ? res.data : null;
          }),
        ),
    );
  }

  async createSegmentBotMapping(data: CreateSegmentBotMappingDto) {
    const query = {
      query: `
        mutation InsertSegmentBot($segment_id: bigint, $bot_id: uuid) {
        insert_segment_bots_one(object: {segment_id: $segment_id, bot_id: $bot_id}, on_conflict: {constraint: segment_bots_segment_id_bot_id_key, update_columns: bot_id}) {
          id
          segment_id
          bot_id
          created_at
        }
      }`,
      variables: {
        segment_id: data.segmentId,
        bot_id: data.botId
      }
    }
    return await this.hasuraGraphQLCall(query);
  }

  async deleteSegmentBotMapping(data: DeleteSegmentBotMappingDto) {
    const query = {
      query: `
      mutation deleteSegmentBots($bot_ids: [uuid!]!) {
        delete_segment_bots(where : {
          bot_id:{ _in : $bot_ids}
        }) {
         affected_rows
        }
    }`,
      variables: {
        bot_ids: data.bot_ids.split(',')
      }
    }
    return await this.hasuraGraphQLCall(query);
  }

  async getMentorsForSegment(segmentId: bigint, title: string, description: string, deepLink: string, limit: string = "200000", offset: string = "0") {
    const query = {
      query: `
        query GetMentorsForSegment($segment_id: bigint, $limit: Int, $offset: Int) {
          mentor(where: {segmentations: {segment_id: {_eq: $segment_id}}, token: {token: {_is_null: false}}}, limit: $limit, offset: $offset, order_by: {id: asc}) {
            phone_no
            officer_name
            token {
              token
            }
          }
        }`,
      variables: {
        segment_id: segmentId,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    }
    const results = await this.hasuraGraphQLCall(query);
    const finalData = [];
    results?.data?.mentor?.forEach(item => {
      finalData.push({
        fcmToken: item.token.token,
        phoneNo: item.phone_no,
        name: item.officer_name,
        title: title,
        description: description,
        fcmClickActionUrl: deepLink,
      })
    });
    return {
      data: finalData
    };
  }

  async getCountForSegment(segmentId: bigint) {
    const query = {
      query: `
      query getCountForSegment($segment_id: bigint) {
        mentor_aggregate(where: {segmentations: {segment_id: {_eq: $segment_id}}, token: {token: {_is_null: false}}}) {
          aggregate {
            count
          }
        }
      }`,
      variables: {
        segment_id: segmentId,
      }
    }
    const results = await this.hasuraGraphQLCall(query);
    const segmentCount = results?.data?.mentor_aggregate?.aggregate?.count;
    return {
      totalCount: segmentCount
    };
  }
  
  async getCountForSegmentV2(segmentIds) {
    let totalCounts = {
      totalCounts: 0, // Initialize totalCounts to zero
      segment_id: {} // Initialize segment_id totalCounts
    };
  
    // Loop through each segment ID and query the total count for that segment
    for (const segmentId of segmentIds) {
      const query = {
        query: `
          query getCountForSegment($segment_id: bigint) {
            mentor_aggregate(where: {segmentations: {segment_id: {_eq: $segment_id}}, token: {token: {_is_null: false}}}) {
              aggregate {
                count
              }
            }
          }`,
        variables: {
          segment_id: segmentId,
        }
      };
  
      const results = await this.hasuraGraphQLCall(query);
      const segmentCount = results?.data?.mentor_aggregate?.aggregate?.count;
  
      // Update totalCounts for each segment
      totalCounts.segment_id[segmentId] = segmentCount;
      
      // Increment totalCounts['totalCounts'] by segmentCount
      totalCounts['totalCounts'] += segmentCount;
    }
  
    return totalCounts;
  }
  
  async getAllSegments() {
    const query = {
      query: `
      query {
        segments {
          id
          name
          description
          created_at
          updated_at
        }
      }`,
    };
    const results = await this.hasuraGraphQLCall(query);
    return results?.data?.segments || [];
  }

  async createSegmentAndMapping(
    segmentName: string,
    segmentDescription: string,
    phoneNumbers: string[],
  ) {
    // Create segment and fetch mentors concurrently
    const [segmentResult, mentors] = await Promise.all([
      this.createSegment(segmentName, segmentDescription),
      this.fetchMentorIds(phoneNumbers)
  ]);

    //  create segment mentor mappings
    const mentorSegmentMappings: SegmentMentorMappingDto[] = mentors.map((mentor) => {
      return {
        mentor_id: mentor.id,
        segment_id: segmentResult.id,
        phone_no:mentor.phone_no
      };
    });

    const mappingsResult = await this.createMappings(mentorSegmentMappings);

    // return segment and mapping response
    return {
      count: mappingsResult,
      segment: segmentResult,
      mentorsMappedWithSegment: mentorSegmentMappings,
    };
  }

  async createSegment(segmentName: string, segmentDescription: string) {
    // create a new segment
    const query = {
      query: `
        mutation CreateSegment($name: String!, $description: String!) {
          insert_segments_one(
            object: { name: $name, description: $description }
          ) {
            id
            name
            description
            created_at
            updated_at
          }
        }`,
      variables: {
        name: segmentName,
        description: segmentDescription,
      },
    };
    const result = await this.hasuraGraphQLCall(query);
    return result?.data?.insert_segments_one;
  }

  async fetchMentorIds(phoneNumbers: string[]) {
    const query = {
      query: `
        query GetMentorIds($phoneNumbers: [String!]!) {
          mentor(where: {phone_no: {_in: $phoneNumbers}}) {
            id,
            phone_no
          }
        }`,
      variables: {
        phoneNumbers: phoneNumbers,
      },
    };

    const result = await this.hasuraGraphQLCall(query);
    return result?.data?.mentor || [];
  }

  async createMappings(mentorSegmentMappings: SegmentMentorMappingDto[]) {
       // Create mentor and segment mappings in batch
       const mutation = {
        query: `
            mutation CreateMappings($objects: [mentor_segmentation_insert_input!]!) {
                insert_mentor_segmentation(objects: $objects) {
                    affected_rows
                }
            }`,
        variables: {
            objects: mentorSegmentMappings.map((mapping) => ({
                mentor_id: parseInt(mapping.mentor_id),
                segment_id: parseInt(mapping.segment_id),
            })),
        },
    };
    const result = await this.hasuraGraphQLCall(mutation);
    return result?.data?.insert_mentor_segmentation?.affected_rows || 0;
  }
  
  async createSegmentBotMappingV2(data: CreateSegmentBotMappingDtoV2) {
    const segmentBotMappings = data.segmentId
      .split(',')
      .map((id) => ({
        segment_id: Number(id.trim()) as unknown as bigint,
        bot_id: data.botId,
      }));

    const query = {
      query: `
        mutation InsertSegmentBots($segmentBotMappings: [segment_bots_insert_input!]!) {
          insert_segment_bots(objects: $segmentBotMappings) {
            returning {
              id
              segment_id
              bot_id
              created_at
            }
          }
        }`,
      variables: {
        segmentBotMappings,
      },
    };

    return await this.hasuraGraphQLCall(query);
  }

  async getMentorsForSegmentsV2(
    segmentIds: bigint[],
    title: string,
    description: string,
    deepLink: string,
    limit: string = '200000',
    offset: string = '0',
  ) {
    const query = {
      query: `
            query GetMentorsForSegments($segment_ids: [bigint!], $limit: Int, $offset: Int) {
                mentor(where: {segmentations: {segment_id: {_in: $segment_ids}}, token: {token: {_is_null: false}}}, limit: $limit, offset: $offset, order_by: {id: asc}) {
                    phone_no
                    officer_name
                    token {
                        token
                    }
                }
            }`,
      variables: {
        segment_ids: segmentIds,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    };

    const results = await this.hasuraGraphQLCall(query);

    const finalData =
      results?.data?.mentor?.map((item) => ({
        fcmToken: item.token.token,
        phoneNo: item.phone_no,
        name: item.officer_name,
        title: title,
        description: description,
        fcmClickActionUrl: deepLink,
      })) || [];

    return {
      data: finalData,
    };
  }

}
