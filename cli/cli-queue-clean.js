#!/usr/bin/env babel-node

import program from 'commander'
import {actionWrapper} from './lib'

import couchbase from '../src/db/couchbase'
import {WorksheetQueueRepository} from '../src/worksheet/models/queue'

program
  .version('0.0.1')
  .option('-q --queueid <queueid>', 'Id de cola de trabajo')
  .action(actionWrapper(mainAction))
  .parse(process.argv)

async function mainAction () {
  const {queueid} = program

  if (!queueid) {
    program.help()
  }

  await couchbase()
  await cleanQueue({queueId: queueid})
}

async function cleanQueue ({queueId}) {
  const worksheetQueueRepository = new WorksheetQueueRepository()
  return worksheetQueueRepository.freeNotInQueueWorksheets(queueId)
}
