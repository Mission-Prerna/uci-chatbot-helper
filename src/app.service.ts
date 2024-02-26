import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';
import { CreateSegmentBotMappingDto } from './dto/CreateSegmentBotMapping.dto';
import { DeleteSegmentBotMappingDto } from './dto/DeleteSegmentBotMapping.dto';

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
            if (res?.data?.errors) {
              // log the error globally & throw 500
              this.logger.error('GraphQl Errors:', res.data.errors);
              throw new InternalServerErrorException(null, 'GraphQl Error occurred.');
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

}
