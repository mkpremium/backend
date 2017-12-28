#!/bin/sh

# Wait for Couchbase to be started
dockerize -wait http://couchbasedb:8091 -timeout 10s

npm start