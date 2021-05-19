#!/usr/bin/env bash

readonly appName=${1:-www}

set -x
./scripts/start-couchbase-and-wait-for-it.sh

set -a && . .env

if [[ -f "bin/${appName}.js" ]];then
  npx ts-node-dev --respawn --trace-warnings -- bin/"${appName}".js
else
  npx ts-node-dev --respawn --trace-warnings -- bin/"${appName}".ts
fi
