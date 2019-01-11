#!/usr/bin/env bash

UPLOAD_CMD='aws s3 cp --profile bitdistrict --region eu-west-3'

# Testing | CircleCI
${UPLOAD_CMD} --recursive conf/circleci s3://mkpremium/config/circleci

# Dev | bitdistrict-m1
${UPLOAD_CMD} --recursive conf/bitdistrict-m1 s3://mkpremium/config/bitdistrict-m1

# Prod | bitdistrict-m3
${UPLOAD_CMD} --recursive conf/bitdistrict-m3 s3://mkpremium/config/bitdistrict-m3
