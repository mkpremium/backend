#!/usr/bin/env babel-node

import program from 'commander';
import Promise from 'bluebird';
import _ from 'lodash';
import {N1qlQuery} from 'couchbase';
import couchbase from '../src/db/couchbase';
import {DbIndexes} from './constants';

program
  .version('0.0.1')
  .option('-n,--name [search]', 'Especifique una cadena de búsqueda (ej: migration_)', '')
  .option('-d,--drop', 'Los indices son solo eliminados', false)
  .option('-N,--dry-run', 'No realiza ninguna acción', false)
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

async function main() {
  const bucket = await couchbase();
  const indexes = indexesToOperate(program.name);
  const indexNames = await Promise.mapSeries(indexes, async(index) => recreateIndex(bucket, index));
  await buildIndexes(bucket, indexNames);
}

function indexesToOperate(searchName) {
  if (searchName) {
    const regexFilter = new RegExp(searchName, 'i');
    return DbIndexes.filter(({name}) => regexFilter.test(name));
  } else {
    return DbIndexes;
  }
}

async function recreateIndex(bucket, index) {
  await dropIndex(bucket, index.name);
  if (program.drop) {
    return;
  }

  return createIndex(bucket, index);
}

async function dropIndex(bucket, indexName) {
  const _lg = result => log(`drop index ${bucket._name}.${indexName}`, result);
  if (program.dryRun) {
    _lg('OK');
    return;
  }
  try {
    const query = N1qlQuery.fromString(`DROP INDEX \`${bucket._name}\`.\`${indexName}\``);
    await bucket.queryAsync(query);
    _lg('OK');
  } catch (e) {
    _lg('FAILURE', e.message);
    // no-op
  }
}

async function createIndex(bucket, {query, name}) {
  const _lg = (result) => log(`create index ${bucket._name}.${name}`, result);

  if (program.dryRun) {
    _lg('OK');
    return;
  }

  try {
    const q = N1qlQuery.fromString(`CREATE INDEX ${name} ON ${bucket._name} ${query} USING GSI WITH {"defer_build":true}`);
    await bucket.queryAsync(q);
    _lg('OK');
    return name;
  } catch (e) {
    _lg('FAILURE', e.message);
    // no-op
  }
}

async function buildIndexes(bucket, indexes) {
  const cleanIndexes = _.compact(indexes).map(name => `\`${name}\``);
  if (cleanIndexes.length === 0) {
    return;
  }
  log(`building indexes`, cleanIndexes);
  const names = cleanIndexes.join(', ');
  await bucket.queryAsync(N1qlQuery.fromString(`BUILD INDEX ON \`${bucket._name}\`(${names}) USING GSI`));
}

function log() {
  const dryRun = program.dryRun ? '(doing nothing)' : '(exec)';
  console.log(dryRun, ...arguments);
}
