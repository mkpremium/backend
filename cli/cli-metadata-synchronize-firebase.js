#!/usr/bin/env babel-node

import program from 'commander';
import {actionWrapper} from './lib';

import couchbase from '../src/db/couchbase';
import {synchronizeMetadataWithFirebase} from './lib/synchronize-firebase-metadata';

program
  .version('0.0.1')
  .action(actionWrapper(mainAction))
  .parse(process.argv);

async function mainAction() {
  await couchbase();
  await synchronizeMetadataWithFirebase();
}
