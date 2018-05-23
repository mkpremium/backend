#!/usr/bin/env bash

aws s3 cp --profile bitdistrict --region eu-west-3 banks-pm2.json s3://mkpremium/config/dev/banks-pm2.json
aws s3 cp --profile bitdistrict --region eu-west-3 mkpremium-pm2.json s3://mkpremium/config/dev/mkpremium-pm2.json
