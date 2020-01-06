#!/usr/bin/env babel-node
import program from 'commander'
import fs from 'fs-extra'
import {seed} from './lib/migrate-building-metadata'

// region main entry
program
  .arguments('[input-file]')
  .version('0.0.1')
  .action(mainAction)
  .parse(process.argv)

function mainAction () {
  if (program.args.length === 0) {
    console.error('input-file is required')
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

async function main (inputFile) {
  await validateFile(inputFile)
  await seed(inputFile)
}

async function validateFile (inputFile) {
  const pathExists = await fs.pathExists(inputFile)
  if (!pathExists) {
    throw new Error(`'${inputFile} doesn't exist or cannot be read.`)
  }

  return true
}
