#!/usr/bin/env bash

set -e

docker-compose up -d

docker/wait-for-it.sh -t 60 localhost:8091 -- echo "Couchbase is up"
