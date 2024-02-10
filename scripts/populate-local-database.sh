#!/usr/bin/env bash

set -xe

set -a && . .env

if [ "${DATABASE}" == 'postgres' ]; then
  npx ts-node ./scripts/postgres/create-user.ts admin 'pa$$w0rd' ADMIN
else
  npx ts-node ./scripts/couchbase/create-user.ts admin 'pa$$w0rd' ADMIN
fi

npx ts-node ./scripts/create-local-data.js
