#!/usr/bin/env bash

readonly appName=${1:-www}

set -x
./scripts/start-couchbase-and-wait-for-it.sh

set -a && . .env

if [[ -f "bin/${appName}.js" ]];then
  npx nodemon bin/"${appName}".js --exec ts-node
else
  npx nodemon bin/"${appName}".ts
fi
