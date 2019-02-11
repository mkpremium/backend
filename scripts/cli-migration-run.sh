#!/usr/bin/env bash

set -e

CURRENT_DIR=$(pwd)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DEFAULT_DATA_DIR=$(realpath ${SCRIPT_DIR}/../fixtures/picked_data)
NODE_CMD="node -r dotenv/config -r babel-register"
DATA_DIR=${1:-"$DEFAULT_DATA_DIR"}

cd ${SCRIPT_DIR}/../

# Load NodeJS version
source ~/.nvm/nvm.sh
nvm use

${NODE_CMD} cli/cli-migrate-worksheets.js --clean ${DATA_DIR}/CSV/
${NODE_CMD} cli/cli-owners-verify.js ${DATA_DIR}/CSV/PROPIETARIOS.csv
${NODE_CMD} cli/cli-building-states.js ${DATA_DIR}/CSV/BUILDING_STATES/
${NODE_CMD} cli/cli-business-states.js ${DATA_DIR}/CSV/BUSINESS_STATES/
${NODE_CMD} cli/cli-building-notes.js ${DATA_DIR}/CSV/BUILDING_NOTES.csv
${NODE_CMD} cli/cli-building-metadata.js ${DATA_DIR}/

cd ${CURRENT_DIR}
