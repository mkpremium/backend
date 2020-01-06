#!/usr/bin/env babel-node
import fs from 'fs-extra'
import program from 'commander'
import {checkInputs} from './lib'
import {alreadySold, noSale, withMeeting} from './lib/migrate-building-states'
import couchbase from '../src/db/couchbase'

// ~/Descargas/ESTADOS EDIFICIOS_ ID CATASTRO (12-2008)

// region main entry
program
  .arguments('[input-dir]')
  .version('0.0.1')
  .action(mainAction)
  .parse(process.argv)

function mainAction () {
  if (program.args.length === 0) {
    console.error('input-dir is required')
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

async function main (inputDir) {
  const inputFiles = [
    'NoVende.csv',
    'Visitas.csv',
    'YaVendido.csv',
    'map-business.json'
  ]

  const files = await checkInputs(inputDir, inputFiles)

  await couchbase()
  const mapBusiness = await fs.readJson(files['map-business.json'])
  await noSale(files['NoVende.csv'])
  await withMeeting(files['Visitas.csv'], mapBusiness)
  await alreadySold(files['YaVendido.csv'])
}
