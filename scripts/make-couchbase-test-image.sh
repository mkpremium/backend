#!/usr/bin/env bash

set -e

pushd docker/couchbase
docker build -t mkpremium:couchbase-test .
popd
