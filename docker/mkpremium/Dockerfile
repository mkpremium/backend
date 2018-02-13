FROM node:carbon-alpine
MAINTAINER Julian Reyes <jreyes@bixlabs.com>

ENV \
  PORT=9001 \
  COUCHBASE_URI=couchbase://127.0.0.1 \
  COUCHBASE_BUCKET=mkpremium \
  COUCHBASE_USER=Administrator \
  COUCHBASE_PASS=password \
  JWT_SECRET=Bitdistrict1sGreat \
  SALT_FACTOR=10

ADD /build /app

WORKDIR /app

RUN npm install && \
  npm install -g pm2

EXPOSE 9001
CMD ["pm2-runtime", "bin/www.js"]
