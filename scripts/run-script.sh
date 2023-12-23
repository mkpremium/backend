#!/usr/bin/env bash

set -a && . .env

script="$1"
shift
npx ts-node "$script" "$@"
