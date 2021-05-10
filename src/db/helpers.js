import _get from 'lodash/get'
import promises from './promises'
import { logger } from '../infrastructure/logger'

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

function attach (bucket) {
  // this is a naive support for promise of the couchbase
  promises(bucket)
  bucket.upsertToDb = upsertToDb
}

export default attach
