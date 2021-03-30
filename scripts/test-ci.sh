#!/usr/bin/env bash

set -e


docker rm -f ci-debug
docker create --name ci-debug -v /tmp/couchbase_logs:/opt/couchbase/var/lib/couchbase/logs \
  -p 8091:8091 -p 8092:8092 -p 8093:8093 -p 8094:8094 -p 11210:11210 couchase-dev
docker start ci-debug
node scripts/couchbase/init-db.js
#npm run test
#npm run test:e2e
