#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

start() {
  docker run -d \
    --name nginxtest \
    -p 80:80 -p 443:443 \
    -v /home/rkmax/Development/BIX/bitdistrict_backend_A0/sites:/sites \
    -t rkmax/nginx:bitdistrict
}

stop() {
  docker stop nginxtest
  docker rm nginxtest
}

restart() {
  stop
  start
}

ACTION=${1:-start}

$ACTION
