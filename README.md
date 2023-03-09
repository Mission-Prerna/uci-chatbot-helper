# UCI Chatbot Helper

### Endpoints
1. Create Bot Segment Mapping:
```
curl --location '{{HOST-URL}}/segment-bot-mapping' \
--header 'Content-Type: application/json' \
--data '{
    "segmentId": 1,
    "botId": "93abe780-ab8a-4619-a0da-8f4f16156231"
}'
```

Response:

```
{
    "data": {
        "insert_segment_bots_one": {
            "id": 9,
            "segment_id": 2,
            "bot_id": "93abe780-ab8a-4619-a0da-8f4f16156231",
            "created_at": "2023-03-07T07:26:38.738862+00:00"
        }
    }
}
```

2. List Mentors for Segment:
```
curl --location '{{HOST-URL}}/segments/{:segmentId}/mentors?limit=1&offset=0&title=Test%20Title&description=Some%20Description&deepLink=https%3A%2F%2Fgoogle.com'
```
- **:segmentId**: ID of the segment
- **deepLink**: deeplink to be embedded in the app (will be replaced with `fcmClickActionUrl` in the response body)
- **limit**: limit on number of records to fetch; defaults to 10
- **offset**: offset for pagination; defaults to 0
- **title**: (OPTIONAL) if present - it'll be returned in the response as well
- **description**: (OPTIONAL) if present - it'll be returned in the response as well

Response:

```
{
    "data": [
        {
            "fcmToken": "xxxx",
            "phoneNo": "xxxx",
            "name": "xxxx",
            "title": "Test Title",
            "description": "Some Description",
            "fcmClickActionUrl": "https://google.com"
        }
    ]
}
```

### Setup
1. Clone the repo
2. Create `.env` & configure the variables as needed. (refer `sample.env` for format)
3. Hit `docker-compose up -d`

### TODOs
- [ ] Add authentication layer
