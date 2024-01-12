#!/usr/bin/env bash

set -x

npx ts-node ./scripts/couchbase/create-user.ts admin admin ADMIN
npx ts-node ./scripts/create-local-data.js
