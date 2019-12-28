#!/usr/bin/env bash

set -e

./wait-for-it.sh  "localhost:8091" -- ./init-couchbase.sh
