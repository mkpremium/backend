#!/usr/bin/env bash

set -e

COUCHBASE_PORT=${COUCHBASE_PORT:-8091}
COUCHBASE_USERNAME=${COUCHBASE_USERNAME:-couchbase}
COUCHBASE_PASSWORD=${COUCHBASE_PASSWORD:-couchbase}

COUCHBASE_BUCKET_NAME=${COUCHBASE_BUCKET_NAME:-mkpremium}
COUCHBASE_BUCKET_RAM_SIZE=${COUCHBASE_BUCKET_RAM_SIZE:-256}

echo "Initializing cluster"
/opt/couchbase/bin/couchbase-cli cluster-init \
  --cluster-name local \
  --cluster-username ${COUCHBASE_USERNAME} \
  --cluster-password ${COUCHBASE_PASSWORD}

echo "Creating bucket ${COUCHBASE_BUCKET_NAME}"
/opt/couchbase/bin/couchbase-cli bucket-create \
  --bucket ${COUCHBASE_BUCKET_NAME} \
  --bucket-type couchbase \
  --bucket-ramsize ${COUCHBASE_BUCKET_RAM_SIZE} \
  -c localhost -u couchbase -p couchbase


echo "Create bucket ${COUCHBASE_BUCKET_NAME} primary index"
cbq \
  -engine http://localhost:${COUCHBASE_PORT} \
  -u ${COUCHBASE_USERNAME} -p ${COUCHBASE_PASSWORD} \
  --script "CREATE PRIMARY INDEX \`${COUCHBASE_BUCKET_NAME}_primary\` ON \`${COUCHBASE_BUCKET_NAME}\`" \
  -exit-on-error
