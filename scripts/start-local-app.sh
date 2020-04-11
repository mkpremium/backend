#!/usr/bin/env bash

set -e

./scripts/start-couchbase-and-wait-for-it.sh

npm start
