#!/usr/bin/env bash

# Dev | bitdistrict-m1
aws s3 cp --profile bitdistrict --region eu-west-3 conf/bitdistrict-m1/banks-pm2.json s3://mkpremium/config/dev/banks-pm2.json
aws s3 cp --profile bitdistrict --region eu-west-3 conf/bitdistrict-m1/mkpremium-pm2.json s3://mkpremium/config/dev/mkpremium-pm2.json

# Prod | bitdistrict-m3
aws s3 cp --profile bitdistrict --region eu-west-3 conf/bitdistrict-m3/banks-pm2.json s3://mkpremium/config/prod/banks-pm2.json
aws s3 cp --profile bitdistrict --region eu-west-3 conf/bitdistrict-m3/mkpremium-pm2.json s3://mkpremium/config/prod/mkpremium-pm2.json
