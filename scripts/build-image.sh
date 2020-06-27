#!/usr/bin/env bash

GIT_HASH=$(git rev-parse HEAD)

docker build -t mk-backend:${GIT_HASH} .
docker tag mk-backend:${GIT_HASH} 173249668334.dkr.ecr.eu-west-1.amazonaws.com/backend:${GIT_HASH}
docker push 173249668334.dkr.ecr.eu-west-1.amazonaws.com/backend:${GIT_HASH}
