#!/usr/bin/env bash

set -e

docker-compose up -d couchbase_db

# wait-for-it will not be enough as it takes some time to the container
# to initialize the cluster
sleep 45

npm run test
