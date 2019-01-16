#!/usr/bin/env babel-node
import program from 'commander';
import {checkInputs} from './lib';
import couchbase from '../src/db/couchbase';
import {migrateBusinessStates} from './lib/migrate-business-states,js';

program
  .arguments('[input-dir]')
  .version('0.0.1')
  .action(mainAction)
  .parse(process.argv);

function mainAction() {
  if (program.args.length === 0) {
    console.error('input-dir is required');
    program.help();
  }

  main(...arguments)
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

async function main(inputDir) {
  const inputFiles = [
    'EstadoSeguimiento.csv'
  ];

  const files = await checkInputs(inputDir, inputFiles);

  await couchbase();
  await migrateBusinessStates(files['EstadoSeguimiento.csv']);
}
