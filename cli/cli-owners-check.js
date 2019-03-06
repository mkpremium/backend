#!/usr/bin/env babel-node

import program from 'commander';
import {actionWrapper} from './lib';

import couchbase from '../src/db/couchbase';
import {checkWorksheetOwners} from './lib/check-owners';

program
  .version('0.0.1')
  .option('--offset <offset>', 'Offset')
  .option('--limit <limit>', 'Offset')
  .action(actionWrapper(mainAction))
  .parse(process.argv);

async function mainAction() {
  let {offset, limit} = program;
  
  if (!offset) {
    offset = 0;
  }
  
  if (!limit) {
    limit = 100;
  }
  
  await couchbase();
  await checkWorksheetOwners(limit, offset);
}
