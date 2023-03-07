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

2. List Mentors for Segment:
```
curl --location '{{HOST-URL}}/segments/1/mentors?limit=1&offset=0&title=Test%20Title&description=Some%20Description&deepLink=https%3A%2F%2Fgoogle.com'
```

### Setup
1. Clone the repo
2. Create `.env` & configure the variables as needed. (refer `sample.env` for format)
3. Hit `docker-compose up -d`
4. Metrics will be exposed at 'http://localhost:xxxx/metrics'