#!/usr/bin/env bash

readonly appName=${1:-www}

set -x
./scripts/start-couchbase-and-wait-for-it.sh

set -a && . .env

if [[ -f "bin/${appName}.js" ]];then
  npx ts-node-dev --respawn -- bin/"${appName}".js
else
  npx ts-node-dev --respawn -- bin/"${appName}".ts
fi
