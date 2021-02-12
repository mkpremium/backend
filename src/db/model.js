import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'
import squel from 'squel'
import { N1qlQuery, SearchQuery } from 'couchbase'
import _ from 'lodash'
import { logger } from '../infrastructure/logger'
import { validate } from 'tcomb-validation'

import init from './couchbase'
import { couchbase } from '../../config'
import { newHttpError } from '../lib/http-error'

class CouchbaseModelStruct {
  constructor () {
    throw new Error('you should define this.Struct as a t.struct')
  }
}

export class CouchbaseModel {
  constructor () {
    CouchbaseModel.prototype._promiseBucket = CouchbaseModel.prototype._promiseBucket || init()
    this.Struct = CouchbaseModelStruct
  }

  async findByIdOrThrow (id) {
    const model = await this.findById(id)
    if (!model) {
      throw newHttpError(404, `${this._getMeta().name} ${id} no existe`)
    }

    return model
  }

  getQueryBuilder (method = 'select', prefix = 't', props = this._getMeta().props) {
    let qb

    switch (method) {
      case 'let':
        qb = squel.let().field(`${prefix}.\`id\``)
        Object.keys(props).forEach(key => qb.field(`${prefix}.\`${key}\``))
        break
      case 'use':
        qb = squel.useKey().field(`${prefix}.\`id\``)
        Object.keys(props).forEach(key => qb.field(`${prefix}.\`${key}\``))
        break
      case 'raw':
        qb = squel.select().field(`RAW ${prefix}.\`id\``)
        break
      case 'select':
        qb = squel.select().field(`${prefix}.\`id\``)
        Object.keys(props).forEach(key => qb.field(`${prefix}.\`${key}\``))
        break
      case 'delete':
        qb = squel.delete()
        break
      case 'update':
        qb = squel.update()
        break
      case 'count':
        qb = squel.select().field('COUNT(*) as count')
        break
      default:
        throw new Error(`method ${method} not allowed (select, delete)`)
    }

    if (method === 'update') {
      qb.table(couchbase.bucket, prefix)
    } else {
      qb.from(couchbase.bucket, prefix)
    }

    qb
      .where(`${prefix}.\`_documentType\` = ?`, this.getType())

    return qb
  }

  _getMeta () {
    if (typeof this.Struct === 'undefined') {
      throw new Error([
        'Something really bad happened, Struct should be defined in some way.',
        'you miss call "await couchbase()" import from src/db/couchbase.',
        'or model types are missing move the import from src/db/couchbase top before another repositories or model.',
        'last thing go to the type model and export it as a real const and import then to your repository',
        'blame rkmax for this :P'
      ].join(' '))
    }
    if (typeof this.Struct.meta === 'undefined') {
      throw new Error('it looks like you forget define the Struct for this model or was not imported correctly')
    }
    return this.Struct.meta
  }

  getType () {
    return this._getMeta().defaultProps._documentType
  }

  async countQuery (queryBuilder = this.getQueryBuilder('count')) {
    const [ { count } ] = await this.query(queryBuilder)
    return count
  }

  async deleteQuery (queryBuilder = this.getQueryBuilder('delete')) {
    return this.query(queryBuilder)
  }

  getSearchBuilder (queryString, indexName) {
    const name = indexName || this.getType()
    return SearchQuery.new(name, SearchQuery.queryString(queryString))
  }

  async search (searchBuilder) {
    logger.debug('model#search', { searchBuilder })
    await this._promiseBucket

    return this._bucket.queryAsync(searchBuilder)
  }

  async raw (query, consistency = couchbase.consistency) {
    const n1ql = N1qlQuery.fromString(query)
    n1ql.consistency(consistency)
    return this.queryRaw(n1ql)
  }

  async queryRaw (query) {
    await this._promiseBucket
    try {
      const result = await this._bucket.queryAsync(query)
      logger.debug('model#queryRaw', { query, result })

      return result
    } catch (error) {
      logger.error('model#queryRaw', { query, error })
      throw error
    }
  }

  getBucketName () {
    return couchbase.bucket
  }

  async query (queryBuilder = this.getQueryBuilder(), consistency = couchbase.consistency) {
    await this._promiseBucket
    const queryParam = queryBuilder.toParam()

    try {
      const n1ql = N1qlQuery.fromString(queryParam.text).consistency(consistency)
      const result = await this._bucket.queryAsync(n1ql, queryParam.values)
      logger.debug('model#query', { consistency, queryParam, queryBuilder, result })
      return result
    } catch (error) {
      logger.error('model#query', { consistency, queryParam, queryBuilder, error })
      throw error
    }
  }

  async unique (data, field) {
    const value = data[ field ]
    const query = this.getQueryBuilder().where(`${field} = ?`, value).limit(1)

    const result = await this.query(query)

    logger.debug('model#unique', { data, field, result })

    if (result && result.length) {
      // we can safely omit data with the same id
      if (data.id && data.id === result[ 0 ].id) {
        return
      }

      const e = new Error(`Value ${data._documentType}.${field} (${value}) cannot be duplicated`)
      e.code = 400
      throw e
    }
  }

  async findById (id) {
    if (_.isEmpty(id)) {
      throw new Error('id should be defined')
    }
    try {
      logger.debug('findById', {
        documentType: this._getMeta().defaultProps._documentType,
        id
      })
      await this._promiseBucket
      const result = await this._bucket.getAsync(id)
      if (result && result.value) {
        return fromJSON(result.value, this.Struct)
      }

      return null
    } catch (e) {
      if (e.code === 13) {
        return null
      } else {
        throw e
      }
    }
  }

  async preSave (data) {
    // no pre-save operations on base model
    return data
  }

  async save (data, sendEvent, opts = {}) {
    const struct = fromJSON(data, this.Struct)
    const dataWithId = t.update(struct, { id: { $set: data.id || uuid() } })
    const dataPreSaved = await this.preSave(dataWithId)

    if (!dataPreSaved) {
      throw new Error('it seems you forgot return the data on the preSave(data) method')
    }

    const validationResult = validate(dataPreSaved, this.Struct)
    if (!validationResult.isValid()) {
      throw new WrongStructRecord(this.getType(), validationResult.errors, data)
    }

    await this._promiseBucket
    const result = await this._bucket.upsertToDb(dataPreSaved.id, dataPreSaved, opts)
    return fromJSON(result, this.Struct)
  }
}
