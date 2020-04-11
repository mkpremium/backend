#!/usr/bin/env bash

curl -XPOST 'http://localhost:9001/operators/login' \
  -H 'Content-Type: application/json' \
  --data-binary '{"username":"business","password":"password"}'
