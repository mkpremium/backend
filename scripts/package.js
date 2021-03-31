#!/usr/bin/env node

const pickBy = require('lodash/pickBy')
const { resolve } = require('path')
const fs = require('fs-extra')
const packageJson = require('../package')

const builtPackage = { ...packageJson, devDependencies: null, scripts: null, }
const output = resolve(`${process.env.BUILD_FOLDER}/package.json`)

fs.writeJsonSync(output, pickBy(builtPackage), {
  spaces: 2
})
