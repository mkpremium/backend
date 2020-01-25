#!/usr/bin/env bash

set -ex

# Clean current build
rm -rf build/

# Build assets
npx babel ./ \
  --out-dir ./build \
  -s \
  --copy-files \
  --ignore node_modules,docker,test,test-e2e

# Build the package.json
scripts/package.js

cd build
git rev-parse HEAD > GIT_COMMIT

rm -r .idea .circleci conf docker docs test test-e2e
