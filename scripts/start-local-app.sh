#!/usr/bin/env bash

set -e

docker-compose up -d couchbase_db

npm start
