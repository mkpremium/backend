#!/usr/bin/env bash

set -e

readonly test_dir=$1

export NODE_ENV=test
npx mocha --config "${PWD}/${test_dir}/.mocharc.js" \
  --retries 3 \
  -r ts-node/register \
  "${test_dir}/**/*.spec.[j|t]s"
