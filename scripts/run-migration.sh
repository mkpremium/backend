#!/usr/bin/env bash

set -e

_current=$(pwd)

source ~/.nvm/nvm.sh

cd /home/ubuntu/apps/mkpremium
nvm use

NODE_CMD="node -r dotenv/config"
DATA_DIR=~/picked_data

${NODE_CMD} cli/cli-migrate-worksheets.js --clean ${DATA_DIR}/CSV/
${NODE_CMD} cli/cli-owners-verify.js ${DATA_DIR}/CSV/PROPIETARIOS.csv
${NODE_CMD} cli/cli-building-states.js ${DATA_DIR}/CSV/BUILDING_STATES/
${NODE_CMD} cli/cli-business-states.js ${DATA_DIR}/CSV/BUSINESS_STATES/
${NODE_CMD} cli/cli-building-notes.js ${DATA_DIR}/CSV/BUILDING_NOTES.csv
${NODE_CMD} cli/cli-building-metadata.js ${DATA_DIR}/

cd ${_current}
