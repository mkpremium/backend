#!/usr/bin/env bash

echo $FIREBASE_CREDENTIALS > firebaseComerciales.json
node bin/www.js
