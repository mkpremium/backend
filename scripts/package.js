#!/usr/bin/env node
const pickBy = require('lodash/pickBy');
const {resolve} = require('path');
const fs = require('fs-extra');
const packageJson = require('../package');
const buildPackage = require('./build-package');

const builtPackage = Object.assign({}, packageJson, buildPackage);
const output = resolve(__dirname, '../build/package.json');

fs.writeJsonSync(output, pickBy(builtPackage), {
  spaces: 2
});
