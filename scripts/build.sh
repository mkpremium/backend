#!/usr/bin/env bash

set -ex

scripts/build-without-dependencies.sh
cd build
npm install
