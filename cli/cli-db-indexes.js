#!/usr/bin/env babel-node

import program from 'commander';
import Promise from 'bluebird';
import {N1qlQuery} from 'couchbase';
import {DbIndexes} from './constants';
import couchbase from '../src/db/couchbase';

program
  .version('0.0.1')
  .option('-n,--name [search]', 'Especifique una cadena de búsqueda (ej: migration_)', '')
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
  const indexes = indexesToRecreate(program.name);
  const indexNames = await Promise.mapSeries(indexes, async(index) => recreateIndex(bucket, index));
  await buildIndexes(bucket, indexNames);
}

function indexesToRecreate(searchName) {
  if (searchName) {
    const regexFilter = new RegExp(searchName, 'i');
    return DbIndexes.filter(({name}) => regexFilter.test(name));
  } else {
    return DbIndexes;
  }
}

async function recreateIndex(bucket, index) {
  await dropIndex(bucket, index.name);
  await createIndex(bucket, index);

  return index.name;
}

async function dropIndex(bucket, indexName) {
  try {
    const query = N1qlQuery.fromString(`DROP INDEX \`${bucket._name}\`.\`${indexName}\``);
    await bucket.queryAsync(query);
  } catch (e) {
    // no-op
  }
}

async function createIndex(bucket, {query, name}) {
  const q = N1qlQuery.fromString(`CREATE INDEX ${name} ON ${bucket._name} ${query} USING GSI WITH {"defer_build":true}`);
  await bucket.queryAsync(q);
}

async function buildIndexes(bucket, indexes) {
  const names = indexes.map(name => `\`${name}\``).join(', ');
  await bucket.queryAsync(N1qlQuery.fromString(`BUILD INDEX ON \`${bucket._name}\`(${names}) USING GSI`));
}
