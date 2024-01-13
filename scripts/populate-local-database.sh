#!/usr/bin/env bash

set -x

# Uncomment the below line to create the admin user in Postgres.
# npx ts-node ./scripts/postgres/create-user.ts admin admin ADMIN
npx ts-node ./scripts/couchbase/create-user.ts admin admin ADMIN
npx ts-node ./scripts/create-local-data.js
