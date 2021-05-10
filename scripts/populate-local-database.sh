#!/usr/bin/env bash

set -x

npx ts-node ./scripts/create-user.ts admin admin ADMIN
npx ts-node ./scripts/couchbase/create-local-data.js
