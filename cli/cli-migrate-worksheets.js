#!/usr/bin/env babel-node
import program from 'commander'

import couchbase from '../src/db/couchbase'
import {checkInputs} from './lib'
import {clean} from './lib/migrate-utils'
import {migrateBuilding} from './lib/migrate-building'
import {migrateOwners} from './lib/migrate-owner'
import {migrateWorksheets} from './lib/migrate-worksheets'
import {Files} from './constants'

program
  .arguments('[input-dir]')
  .version('0.0.1')
  .option('-c, --clean', 'Elimina los datos previos')
  .action(mainAction)
  .parse(process.argv)

// region main entry
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
    Files.OWNERS,
    Files.WORKSHEET_RELATIONS,
    Files.BUILDINGS
  ]

  const files = await checkInputs(inputDir, inputFiles)

  const bucket = await couchbase()
  await clean(program.clean)
  await migrateBuilding(files[Files.BUILDINGS], bucket)
  await migrateOwners(files[Files.OWNERS], bucket)
  await migrateWorksheets(files[Files.WORKSHEET_RELATIONS], bucket)
}
