#!/usr/bin/env bash

readonly appName=${1:-www}

set -x

set -a && . .env

npx ts-node-dev --respawn --trace-warnings -- bin/"${appName}"
