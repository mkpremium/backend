#!/usr/bin/env bash

set -x
set -a && . ../../.env

npx ts-node $1
