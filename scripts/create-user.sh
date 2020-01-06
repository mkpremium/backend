#!/usr/bin/env bash

readonly username=${1:-business}
readonly password=${2:-password}
readonly role=${role:-BUSINESS}

npx nodemon --exec babel-node ./cli/cli.js operator add \
  --username ${username} --password ${password} --role ${role}
