#!/usr/bin/env babel-node
import program from 'commander';
import {checkInputs, validateHeaders} from './lib';

// region main entry
program
  .arguments('[input-file]')
  .version('0.0.1')
  .action(mainAction)
  .parse(process.argv);

function mainAction() {
  if (program.args.length === 0) {
    console.error('input-file is required');
    program.help();
  }

  main.apply(null, arguments)
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

// endregion

async function main(inputFile) {

}
