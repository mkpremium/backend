#!/usr/bin/env bash

docker-compose up -d couchbase_db

docker/wait-for-it.sh localhost:8091 -- echo "Waiting for primary index"

readonly max_attempts=${MAX_ATTEMPTS:-5}
curr_attempt=1
echo "Waiting for primary index creation, it will try $max_attempts attempts"

while :
do
  echo "Checking primary index, attempt: ${curr_attempt}"
  docker-compose exec -T couchbase_db /opt/couchbase/bin/cbindex -auth couchbase:couchbase -type list | grep Index:mkpremium/mkpremium_primary

  if [[ $? -eq 0 ]]; then
    echo "Primary index ready on attempt ${curr_attempt}"
    break
  fi

  ((curr_attempt=curr_attempt+1))

  if [[ ${curr_attempt} -ge max_attempts ]]; then
    echo "Couchbase DB index is not ready after ${max_attempts}(${curr_attempt})"
    exit 1
  fi
done
