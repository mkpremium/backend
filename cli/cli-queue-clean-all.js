#!/usr/bin/env babel-node

import program from 'commander';
import {actionWrapper} from './lib';

import couchbase from '../src/db/couchbase';
import {WorksheetQueueRepository} from '../src/worksheet/models/queue';

program
  .version('0.0.1')
  .action(actionWrapper(mainAction))
  .parse(process.argv);

async function mainAction() {
  await couchbase();
  await cleanQueue();
}

async function cleanQueue() {
  const worksheetQueueRepository = new WorksheetQueueRepository();
  return worksheetQueueRepository.cleanAllWorksheetsNotInQueue();
}
