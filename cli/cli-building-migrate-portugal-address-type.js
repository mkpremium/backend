#!/usr/bin/env babel-node
import program from 'commander'
import fs from 'fs-extra'
import couchbase from '../src/db/couchbase'
import {migrate} from './lib/migrate-portugal-address'

// region main entry
program
  .arguments('[input-file]')
  .version('0.0.1')
  .action(mainAction)
  .parse(process.argv)

function mainAction () {
  if (program.args.length === 0) {
    console.error('input-file is required.')
    program.help()
  }

  main.apply(null, arguments)
    .then(() => {
      process.exit(0)
    })
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}

// endregion

async function main (inputFile) {
  await validateFile(inputFile)
  await couchbase()
  await migrate(inputFile)
}

// region file-management
async function validateFile (inputFile) {
  const pathExists = await fs.pathExists(inputFile)
  if (!pathExists) {
    throw new Error(`'${inputFile} doesn't exist or cannot be read`)
  }
}
// endregion
