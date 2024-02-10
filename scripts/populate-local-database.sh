#!/usr/bin/env bash

set -xe

set -a && . .env

npx ts-node ./scripts/postgres/create-user.ts admin 'pa$$w0rd' ADMIN

npx ts-node ./scripts/create-local-data.js
