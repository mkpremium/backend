#!/usr/bin/env bash

readonly username=${1:-business}
readonly password=${2:-password}
readonly role=${3:-BUSINESS}

npx babel-node ./cli/cli.js operator add \
  --username ${username} --password ${password} --role ${role}
