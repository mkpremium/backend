#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

docker build --no-cache -t rkmax/couchbase:bitdistrict ${DIR}/couchbase
