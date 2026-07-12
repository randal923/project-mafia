FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY server/package.json server/yarn.lock ./server/
RUN yarn --cwd server install --frozen-lockfile

COPY shared ./shared
COPY server ./server

RUN yarn --cwd server build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true && yarn cache clean

COPY server/package.json server/yarn.lock ./server/
RUN yarn --cwd server install --frozen-lockfile --production=true && yarn cache clean

COPY --from=build /app/server/dist ./server/dist
COPY server/missions ./server/missions

WORKDIR /app/server

USER node

EXPOSE 4000

CMD ["node", "dist/server/src/index.js"]
