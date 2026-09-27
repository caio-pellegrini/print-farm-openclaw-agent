FROM node:22-alpine

WORKDIR /app

COPY package.json build.mjs server.mjs ./
COPY public ./public

RUN node build.mjs \
    && mkdir -p /data \
    && chown -R node:node /app /data

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4173 \
    LANDING_DATA_DIR=/data

EXPOSE 4173
USER node

CMD ["node", "server.mjs"]
