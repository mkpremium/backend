#!/usr/bin/env bash

#set -e

./scripts/start-couchbase-and-wait-for-it.sh

set -a && . .env
npx nodemon bin/www.js --exec babel-node
