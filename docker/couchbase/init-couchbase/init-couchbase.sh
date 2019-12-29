#!/usr/bin/env bash

set -e


COUCHBASE_PORT=${COUCHBASE_PORT:-8091}
COUCHBASE_USERNAME=${COUCHBASE_USERNAME:-couchbase}
COUCHBASE_PASSWORD=${COUCHBASE_PASSWORD:-couchbase}
COUCHBASE_CLUSTER_RAM_SIZE=${COUCHBASE_CLUSTER_RAM_SIZE:-512}
COUCHBASE_INDEX_RAM_SIZE=${COUCHBASE_INDEX_RAM_SIZE:-256}

COUCHBASE_BUCKET_NAME=${COUCHBASE_BUCKET_NAME:-mkpremium}
COUCHBASE_BUCKET_RAM_SIZE=${COUCHBASE_BUCKET_RAM_SIZE:-512}

if [ ! -f ./cluster_initialized ]; then
  echo "Initializing cluster"
  /opt/couchbase/bin/couchbase-cli cluster-init \
    --cluster-name local \
    --cluster-username ${COUCHBASE_USERNAME} \
    --cluster-password ${COUCHBASE_PASSWORD} \
    --cluster-ramsize ${COUCHBASE_CLUSTER_RAM_SIZE} \
    --cluster-index-ramsize ${COUCHBASE_INDEX_RAM_SIZE} \
    --index-storage-setting default \
    --services data,index,query
  echo "Cluster initialised" > ./cluster_initialized
fi

if [ ! -f ./bucket_created ]; then
  echo "Creating bucket ${COUCHBASE_BUCKET_NAME}"
  /opt/couchbase/bin/couchbase-cli bucket-create \
    --bucket ${COUCHBASE_BUCKET_NAME} \
    --bucket-type couchbase \
    --bucket-ramsize ${COUCHBASE_BUCKET_RAM_SIZE} \
    -c localhost -u couchbase -p couchbase \
    --wait
  echo "Bucket created" > ./bucket_created
fi

if [ ! -f ./index_created ]; then
  echo "Creating primary index on bucket ${COUCHBASE_BUCKET_NAME}"

  /opt/couchbase/bin/cbindex -type create \
    -auth ${COUCHBASE_USERNAME}:${COUCHBASE_PASSWORD} \
    -bucket ${COUCHBASE_BUCKET_NAME} \
    -index ${COUCHBASE_BUCKET_NAME}_primary \
    -primary=true  -using forestdb >> index_log

  echo "Index created" > ./index_created
else
  sv stop init-couchbase
fi
