#!/usr/bin/env node

require('babel-register')
require('babel-polyfill')
require('dotenv').config()
require('../src/migration/bin/migration')
