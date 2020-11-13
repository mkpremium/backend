#!/usr/bin/env bash

set -e

node scripts/couchbase/init-db.js
npm run test
npm run test:e2e
