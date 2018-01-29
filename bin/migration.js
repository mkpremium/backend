#!/usr/bin/env node

require('babel-register');
require('babel-polyfill');
require('../src/migration/bin/migration');
