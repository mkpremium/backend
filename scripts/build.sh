#!/usr/bin/env bash

set -ex

# Clean current build
rm -rf build/

# Build assets
npx babel ./ \
  --out-dir ./build \
  -s -q \
  --copy-files \
  --ignore node_modules,docker,test

# Build the package.json
scripts/package.js

cd build
npm i
