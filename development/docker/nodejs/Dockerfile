# Note: the context must be set to the root of the project ('../..' from here)
# This is automatically done if you use the root docker-compose.yml file
# => All paths in this file are relative to the context! <=

# Base image
FROM node:boron-alpine

# Configure container
ENV NPM_CONFIG_LOGLEVEL warn
ENV DOCKERIZE_VERSION v0.4.0

# Install dockerize (https://github.com/jwilder/dockerize)
RUN apk add --no-cache --update \
        make git bash \
        openssl \
        curl \
        gcc \
        g++ \
        python \
    && apk del \
    && rm -rf /var/cache/apk/* && rm -rf /tmp/*

RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# COPY setup script
COPY ./docker/nodejs/docker-setup.sh /

# Setup directories and permissions
RUN chmod +x /docker-setup.sh

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/

RUN npm install