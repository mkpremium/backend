#!/usr/bin/env bash

set -ex

readonly build_folder=${BUILD_FOLDER:-/tmp/mkpremium-backend-build}
# Clean current build
rm -rf ${build_folder}

# Build assets
npx babel ./ \
  --out-dir ${build_folder} \
  -s \
  --copy-files \
  --ignore node_modules,docker,test,test-e2e

# Build the package.json
BUILD_FOLDER=$build_folder scripts/package.js

cd ${build_folder}
# Create folder for uploads (email attachments)
mkdir .uploads
git rev-parse HEAD > GIT_COMMIT

rm -rf .idea .circleci conf docker docs test test-e2e node_modules
