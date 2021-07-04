#!/usr/bin/env bash

set -xe

readonly test_dir=$1

ALL_ARGS=("$@")
TEST_ARGS=("${ALL_ARGS[@]:1}")

# shellcheck disable=SC1090
set -a && . "${PWD}/${test_dir}/.env"

export NODE_ENV=test
npx mocha --config "${PWD}/${test_dir}/.mocharc.js" \
  --retries 3 \
  --check-leaks \
  --trace-warnings \
  -r ts-node/register \
  --extension js --extension ts \
  -b "${TEST_ARGS[@]}" "${test_dir}/**/*.spec.[j|t]s"
