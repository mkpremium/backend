# Build container
FROM node:16

RUN ["npm", "install", "-g", "npm@9.9.0", "--silent"]

RUN ["mkdir", "/app"]
WORKDIR /app

COPY package-lock.json .
COPY package.json .
RUN ["npm", "ci", "--silent"]
RUN ["npx", "prisma", "generate"]

COPY . .

RUN ["npm", "run", "build"]
COPY package.json build
COPY package-lock.json build

RUN ["cp", "-r", "fonts", "build"]
WORKDIR /app/build
RUN ["npm", "ci", "--production", "--silent"]
RUN ["mkdir", ".uploads"]

# Run container
FROM node:16

RUN ["mkdir", "/app"]
WORKDIR /app

ARG app_version
ENV app_version=$app_version

COPY --from=0 /app/build .

ENV PORT 9001
