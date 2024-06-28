FROM node:18-slim AS base
RUN apt-get update -y && apt-get install -y openssl

# Create app directory
FROM base AS install
WORKDIR /app

# A wildcard is used to ensure both package.json AND yarn.lock are copied
COPY package.json ./
COPY yarn.lock ./
# Install app dependencies
RUN yarn install

FROM base as build
WORKDIR /app
COPY prisma ./prisma/
COPY --from=install /app/node_modules ./node_modules
RUN npx prisma generate
COPY . .
RUN yarn run build

FROM base
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/yarn.lock ./
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
CMD [ "yarn", "run", "start:prod" ]
