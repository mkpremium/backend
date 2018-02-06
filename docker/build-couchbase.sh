#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

docker build -t couchbase:bitdistrict ${DIR}/couchbase
docker tag couchbase:bitdistrict rkmax/couchbase:bitdistrict
docker push rkmax/couchbase:bitdistrict
