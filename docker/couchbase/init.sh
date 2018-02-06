#!/usr/bin/env bash

#
# heavily inspired by https://github.com/moxious/couchbase-docker-circleci
# Julian Reyes <jreyes@bixlabs.com>
#

COUCHBASE_PORT=8091

wait_for_start() {
    "$@"
    while [ $? -ne 0 ]
    do
        echo 'waiting for couchbase to start'
        sleep 2
        "$@"
    done
}

echo "launch couchbase"
/entrypoint.sh couchbase-server &

wait_for_start \
  couchbase-cli server-info -c localhost:${COUCHBASE_PORT} -u ${COUCHBASE_USER} -p ${COUCHBASE_PASS}

echo "Configuring cluster"
couchbase-cli \
  cluster-init -c 127.0.0.1 \
  --cluster-username=${COUCHBASE_USER} \
  --cluster-password=${COUCHBASE_PASS} \
  --cluster-port=${COUCHBASE_PORT} \
  --cluster-ramsize=${COUCHBASE_CLUSTER_RAM_SIZE} \
  --services=data,index,query,fts

echo "Configuring bucket ${COUCHBASE_BUCKET}"
couchbase-cli \
  bucket-create -c 127.0.0.1 \
  --username=${COUCHBASE_USER} \
  --password=${COUCHBASE_PASS} \
  --bucket=${COUCHBASE_BUCKET} \
  --bucket-type=${COUCHBASE_BUCKET_TYPE} \
  --bucket-ramsize=${COUCHBASE_BUCKET_RAM_SIZE} \
  --wait

echo "Create bucket ${COUCHBASE_BUCKET} primary index"
wait_for_start cbq \
  -engine http://localhost:${COUCHBASE_PORT} \
  -u ${COUCHBASE_USER} -p ${COUCHBASE_PASS} \
  --script "CREATE PRIMARY INDEX \`${COUCHBASE_BUCKET}_primary\` ON \`${COUCHBASE_BUCKET}\`" \
  -exit-on-error

wait
