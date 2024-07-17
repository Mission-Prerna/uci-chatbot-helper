# UCI Chatbot Helper

### Endpoints

1. **Get service Health**

```
curl --location '{{HOST-URL}}/health'
```

Response:
```
{
    "status": "ok",
    "info": {
        "database": {
            "status": "up"
        }
    },
    "error": {},
    "details": {
        "database": {
            "status": "up"
        }
    }
}
```

2. **Get all segments**

```
curl --location '{{HOST-URL}}/segments' \
--header 'conversation-authorization: <admin-token>'
```

Response:
```
[
    {
        "id": 1,
        "name": "Test 1",
        "description": "Test 1 segmentation",
        "created_at": "2023-03-03T09:40:01.711Z",
        "updated_at": "2023-03-03T09:40:17.376Z"
    },
    {
        "id": 2,
        "name": "Test 2",
        "description": "Test 2 segmentation",
        "created_at": "2023-04-12T10:59:54.615Z",
        "updated_at": "2023-04-12T10:59:54.615Z"
    }
]
```

3. **Create Bot Segment Mapping:**

```
curl --location '{{HOST-URL}}/segment-bot-mapping' \
--header 'conversation-authorization: <admin-token>' \
--header 'Content-Type: application/json' \
--data '{
    "botId":"0f90a738-768d-4cd6-91e1-e66a3b8be508",
    "segmentId":1
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

4. **List Mentors for Segment:**

```
curl --location '{{HOST-URL}}/segments/{:segmentId}/mentors?title=Test%20Title&deepLink=https%3A%2F%2Fgoogle.com&limit=1&offset=0&description=Test%20description' \
--header 'conversation-authorization: <admin-token>'
```

- **:segmentId**: ID of the segment
- **deepLink**: deeplink to be embedded in the app (will be replaced with `fcmClickActionUrl` in the response body)
- **limit**: limit on number of records to fetch; defaults to 1,00,000
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

5. **Get Segment Mentor Count**

```
curl --location '{{HOST-URL}}/segments/{:segmentId}/mentors/count' \
--header 'conversation-authorization: <admin-token>'
```

- **:segmentId**: ID of the segment

Response:
```
{
    "totalCount": 37
}
```

6. **Create Segment mentors mapping**

```
curl --location '{{HOST-URL}}/segment/phone' \
--header 'conversation-authorization: <admin-token>' \
--header 'Content-Type: application/json' \
--data '{
    "segment_name":"Test segment",
    "segment_description":"Test segments description",
    "phone_numbers":["1234567890"]
}'
```

- **phone_numbers**: `phone_numbers` contains multiple mentors number in an array

7. **Create Segments Bot Mapping:**

```
curl --location '{{HOST-URL}}/v2/segment-bot-mapping' \
--header 'conversation-authorization: <admin-token>' \
--header 'Content-Type: application/json' \
--data '
    {
        "botId": "0f90a738-768d-4cd6-91e1-e66a3b8be508",
        "segmentId": "1,2"
    }
'
```

- **segmentId**: `segmentId` contains multiple segments ids in a comma-separated string

8. **Get Segments mentors mappings**

```
curl --location '{{HOST-URL}}/v2/segments/{:segmentIds}/mentors' \
--header 'conversation-authorization: <admin-token>'
```

- **:segmentIds**: `segmentIds` are comma-separated segments Ids
- **deepLink**: deeplink to be embedded in the app (will be replaced with `fcmClickActionUrl` in the response body)
- **limit**: limit on number of records to fetch; defaults to 1,00,000
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

9. **Get Segments mentors mappings count**

```
curl --location '{{HOST-URL}}/v2/segments/{:segmentIds}/mentors/count' \
--header 'conversation-authorization: <admin-token>'
```

- **:segmentIds**: `segmentIds` are comma-separated segments Ids

Response:
```
{
    "totalCount": 439389,
    "segment_id": {
        "1": 37,
        "2": 439352
    }
}
```

### Setup

1. Clone the repo
2. Create `.env` & configure the variables as needed. (refer `sample.env` for format)
3. Hit `docker-compose up -d`

### Note

Ensure to replace `<admin-token>` in the headers with your actual admin token for authorization.

---
