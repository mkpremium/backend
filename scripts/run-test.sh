#!/usr/bin/env bash

set -e

readonly test_dir=$1

export NODE_ENV=test
npx mocha --config "${PWD}/${test_dir}/.mocharc.js" "${test_dir}/**/*.spec.js" --retries 2
