#!/usr/bin/env bash

set -e

_current=$(pwd)

# setup
source ~/.nvm/nvm.sh
cd /home/ubuntu/apps/mkpremium
nvm use

NODE_CMD="node -r dotenv/config"

${NODE_CMD} cli/cli-queue-clean-all.js

cd ${_current}
