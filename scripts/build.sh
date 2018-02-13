#!/usr/bin/env bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Clean current build
rm -rf build/*

# Build assets
babel ./ \
  --out-dir ./build \
  -s -q \
  --copy-files \
  --ignore node_modules,development,test,docker,iml,lock

# Node setup
cp ./.nvmrc ./build/

# Build the package.json
${DIR}/package.js

# Just for local testing
# cp .env build/
# cd build
# ln -s ${DIR}/../node_modules .

