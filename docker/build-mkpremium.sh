#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

tag=`git rev-parse --short HEAD`
cp -r ${DIR}/../build ${DIR}/mkpremium/build
docker build --no-cache -t rkmax/mkpremium:${tag} ${DIR}/mkpremium
