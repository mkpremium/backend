# Build container
FROM node:9

RUN ["npm", "install", "-g", "npm"]

ENV BUILD_FOLDER "/app/build"
RUN ["mkdir", "/app"]
WORKDIR /app

COPY package-lock.json .
COPY package.json .
RUN ["npm", "install"]

COPY . .

RUN ["scripts/build-without-dependencies.sh"]

WORKDIR /app/build

RUN ["npm", "install", "--production"]

# Run container
FROM node:9

RUN ["mkdir", "/app"]
WORKDIR /app

COPY --from=0 /app/build .

ENV PORT 9001
