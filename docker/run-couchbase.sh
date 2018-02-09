#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

start() {
  docker run -d \
    --name couchtest \
    -p 8090-8099:8090-8099 -p 9110:9110 -p 11210:11210 -p 18091:18091 -p 18092:18092 \
    -t rkmax/couchbase:bitdistrict
}

stop() {
  docker stop couchtest
  docker rm couchtest
}

restart() {
  stop
  start
}

ACTION=${1:-start}

$ACTION
