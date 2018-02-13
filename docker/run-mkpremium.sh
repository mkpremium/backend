#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

start() {
  docker run -d \
    --name mkpremiumtest \
    -p 9001:9001 \
    -t rkmax/mkpremium:73234a7
}

stop() {
  docker stop mkpremiumtest
  docker rm mkpremiumtest
}

restart() {
  stop
  start
}

ACTION=${1:-start}

$ACTION
