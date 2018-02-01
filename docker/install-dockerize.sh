#!/usr/bin/env bash

set -e

DOCKERIZE_VERSION=${DOCKERIZE_VERSION:-v0.6.0}

echo wget "https://github.com/jwilder/dockerize/releases/download/${DOCKERIZE_VERSION}/dockerize-linux-amd64-${DOCKERIZE_VERSION}.tar.gz"
echo tar -C /usr/local/bin -xzvf dockerize-linux-amd64-${DOCKERIZE_VERSION}.tar.gz
echo rm dockerize-linux-amd64-${DOCKERIZE_VERSION}.tar.gz
