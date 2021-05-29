# Build container
FROM node:14

RUN ["npm", "install", "-g", "npm"]

RUN ["mkdir", "/app"]
WORKDIR /app

COPY package-lock.json .
COPY package.json .
RUN ["npm", "install"]

COPY . .

RUN ["npm", "run", "build"]
COPY package.json build
COPY package-lock.json build

COPY fonts app/build
WORKDIR /app/build
RUN ["npm", "install", "--production"]
RUN ["mkdir", ".uploads"]

# Run container
FROM node:14

RUN ["mkdir", "/app"]
WORKDIR /app

COPY --from=0 /app/build .

ENV PORT 9001
