#!/usr/bin/env bash

#set -e
readonly appName=${1:-www}
echo "appName: ${appName}"

./scripts/start-couchbase-and-wait-for-it.sh

set -a && . .env
npx nodemon bin/"${appName}".js --exec babel-node
