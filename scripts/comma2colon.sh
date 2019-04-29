#!/usr/bin/env bash

set -e

file=${1}
temp=${file}_

q -O -H -d "," -D ";" "SELECT * FROM ${file}" > ${temp}
mv ${temp} ${file}
