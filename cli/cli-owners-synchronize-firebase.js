#!/usr/bin/env babel-node

import program from 'commander'
import {actionWrapper} from './lib'

import couchbase from '../src/db/couchbase'
import {synchronizeFirebase} from './lib/synchronize-firebase-verified-owners'

program
  .version('0.0.1')
  .action(actionWrapper(mainAction))
  .parse(process.argv)

async function mainAction () {
  await couchbase()
  await synchronizeFirebase()
}
