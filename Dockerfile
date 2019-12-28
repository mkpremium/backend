FROM node:8.17.0

RUN ["mkdir", "/app"]
WORKDIR /app

COPY package-lock.json .
COPY package.json .
RUN ["npm", "install"]

COPY . .

RUN ["scripts/build.sh"]

ENV PORT 9001
