#!/usr/bin/env bash

set -x

./scripts/create-user.sh admin admin ADMIN
node ./scripts/couchbase/create-local-data.js
