import _get from 'lodash/get'
import { N1qlQuery } from 'couchbase'
import debug from 'debug'
import { couchbase } from '../../config'
import promises from './promises'

const debugHelper = debug('app:db:helpers')

export async function getList (documentType) {
  const queryString = N1qlQuery.fromString('SELECT t.* FROM $1 t WHERE t._documentType = \'$2\' LIMIT 100')

  return this.queryAsync(queryString, [couchbase.bucket, documentType])
}

export async function upsertToDb (pk, data) {
  const name = _get(data, '_documentType', '')
  debugHelper('upsertToDb', name, pk, data)
  await this.upsertAsync(pk, data)
  const result = await this.getAsync(pk)

  if (result && result.value) {
    return result.value
  }

  return null
}

export async function removeAll () {
  const queryString = N1qlQuery
    .fromString(`DELETE FROM ${couchbase.bucket}`)
    .consistency(N1qlQuery.Consistency.STATEMENT_PLUS)
  await this.query(queryString)
}

function attach (bucket) {
  // this is a naive support for promise of the couchbase
  promises(bucket)
  bucket.getList = getList
  bucket.removeAll = removeAll
  bucket.upsertToDb = upsertToDb
}

export default attach
