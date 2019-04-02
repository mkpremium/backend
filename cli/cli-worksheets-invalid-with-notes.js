#!/usr/bin/env babel-node
import program from 'commander';
import couchbase from '../src/db/couchbase';
import {getList} from "./lib/get-worksheets-invalid-with-notes";

// region main entry
program
  .version('0.0.1')
  .action(mainAction)
  .parse(process.argv);

function mainAction() {
  main.apply(null)
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

// endregion

async function main() {
  await couchbase();
  await getList();
}
