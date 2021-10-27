# Build container
FROM node:14

RUN ["npm", "install", "-g", "npm", "--silent"]

RUN ["mkdir", "/app"]
WORKDIR /app

COPY package-lock.json .
COPY package.json .
RUN ["npm", "install", "--silent"]

COPY . .

RUN ["npm", "run", "build"]
COPY package.json build
COPY package-lock.json build

RUN ["cp", "-r", "fonts", "build"]
WORKDIR /app/build
RUN ["npm", "install", "--production", "--silent"]
RUN ["mkdir", ".uploads"]

# Run container
FROM node:14

RUN ["mkdir", "/app"]
WORKDIR /app

ARG app_version
ENV app_version=$app_version

COPY --from=0 /app/build .

ENV PORT 9001
