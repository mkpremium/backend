import {N1qlQuery} from 'couchbase';
import {couchbase} from '../../config';

export async function getList(documentType) {
  const queryString = N1qlQuery.fromString('SELECT t.* FROM $1 t WHERE t._documentType = \'$2\' LIMIT 100');
  const results = await this.query(queryString, [couchbase.bucket, documentType]);

  return results;
}

export async function removeAll() {
  const queryString = N1qlQuery.fromString('DELETE FROM $S');
  await this.query(queryString, [couchbase.bucket]);
}

function attach(bucket) {
  bucket.getList = getList;
  bucket.removeAll = removeAll;
}

export default attach;
