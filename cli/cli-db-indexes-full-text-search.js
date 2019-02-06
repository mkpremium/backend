#!/usr/bin/env babel-node

import program from 'commander';
import Promise from 'bluebird';
import couchbase from '../src/db/couchbase';
import {DBIndexesFullTextSearch} from './constants';
import axios from 'axios';
import debug from 'debug';
const debugService = debug('app:migration:fts');

program
  .version('0.0.1')
  .action(mainEntry)
  .parse(process.argv);

// region main entry
function mainEntry() {
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

const instance = axios.create({
  baseURL: 'http://127.0.0.1:8094/api/index/',
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json'
  },
  auth: {
    username: process.env.COUCHBASE_USER,
    password: process.env.COUCHBASE_PASS
  }
});

async function main() {
  const bucket = await couchbase();
  await Promise.mapSeries(DBIndexesFullTextSearch, async(index) => createSearchIndex(bucket, index));
}

async function createSearchIndex(bucket, index) {
  await dropIndex(index.name);
  return createIndex(bucket, index);
}

async function dropIndex(indexName) {
  try {
    await instance.delete(indexName);
    debugService('DROP INDEX OK', indexName);
  } catch (error) {
    debugService('DROP INDEX FAILURE', indexName, error.message);
  }
}

async function createIndex(bucket, {name, definition}) {
  debugService('Adding index', 'requester PUT ', name);
  
  return instance.put(name, definition)
    .then((result) => {
      debugService('CREATE INDEX', name, result.statusText);
    })
    .catch(error=> console.log('Error creating index: ', name, 'error:', error));
}
