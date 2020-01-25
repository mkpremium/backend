FROM node:8.11.1

RUN ["npm", "install", "-g", "npm"]

RUN ["mkdir", "/app"]
WORKDIR /app

COPY package-lock.json .
COPY package.json .
RUN ["npm", "install"]

COPY . .

RUN ["scripts/build.sh"]

ENV PORT 9001
