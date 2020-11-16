#!/usr/bin/env bash

set -m

/entrypoint.sh couchbase-server &

sleep 15

curl -v http://127.0.0.1:8091/pools/default -d memoryQuota=512 -d indexMemoryQuota=512
curl -v http://127.0.0.1:8091/node/controller/setupServices -d services=kv%2cn1ql%2Cindex
curl -v http://127.0.0.1:8091/settings/web -d port=8091 -d username="$COUCHBASE_USERNAME" -d password="$COUCHBASE_PASSWORD"

curl -i -u "$COUCHBASE_USERNAME":"$COUCHBASE_PASSWORD" http://127.0.0.1:8091/settings/indexes -d 'storageMode=forestdb'

sleep 15

# shellcheck disable=SC2006
curl -v http://127.0.0.1:8091/query/service -d "statement=CREATE PRIMARY INDEX ON `$COUCHBASE_BUCKET`"

fg 1
