#!/usr/bin/env babel-node
import program from 'commander';
import {checkInputFile} from './lib';
import {migrateOwners} from './lib/migrate-owners-v3';

program
  .arguments('[input-file]')
  .version('0.0.1')
  .action(mainAction)
  .parse(process.argv);

// region main entry
function mainAction() {
  if (program.args.length === 0) {
    console.error('input-file is required');
    program.help();
  }

  main.apply(null, arguments)
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

// endregion

async function main(inputFile) {
  await checkInputFile(inputFile);
  await migrateOwners(inputFile);
}
