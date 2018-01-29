import {N1qlQuery} from 'couchbase';
import {couchbase} from '../../config';
import promises from './promises';

export async function getList(documentType) {
  const queryString = N1qlQuery.fromString('SELECT t.* FROM $1 t WHERE t._documentType = \'$2\' LIMIT 100');

  return this.query(queryString, [couchbase.bucket, documentType]);
}

export async function upsertToDb(pk, data) {
  await this.upsertAsync(pk, data);
  return this.getAsync(pk);
}

export async function removeAll() {
  const queryString = N1qlQuery.fromString('DELETE FROM $S');
  await this.query(queryString, [couchbase.bucket]);
}

function attach(bucket) {
  // this is a naive support for promise of the couchbase
  promises(bucket);
  bucket.getList = getList;
  bucket.removeAll = removeAll;
  bucket.upsertToDb = upsertToDb;
}

export default attach;
