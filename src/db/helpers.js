import _get from 'lodash/get'
import { N1qlQuery } from 'couchbase'
import { couchbase } from '../../config'
import promises from './promises'
import { logger } from '../infrastructure/logger'

export async function getList (documentType) {
  const queryString = N1qlQuery.fromString('SELECT t.* FROM $1 t WHERE t._documentType = \'$2\' LIMIT 100')

  return this.queryAsync(queryString, [ couchbase.bucket, documentType ])
}

export async function upsertToDb (id, data) {
  const documentType = _get(data, '_documentType', '')
  logger.debug('upsertToDb', { documentType, id, data })
  await this.upsertAsync(id, data)
  const result = await this.getAsync(id)

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
