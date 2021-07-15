import t, { Struct as TcombStruct } from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'
import squel from 'squel'
import _ from 'lodash'
import { logger } from '../infrastructure/logger'
import { validate } from 'tcomb-validation'

import { couchbase } from '../../config'
import { newHttpError } from '../lib/http-error'
import { WrongStructRecord } from '../infrastructure/wrong-struct-record.error'
import retry from 'bluebird-retry'
import { Bucket, DocumentNotFoundError, InternalServerFailureError, TemporaryFailureError } from 'couchbase'
import { CouchbaseAdapter } from './couchbase.adapter'

/**
 * @deprecated use CouchbaseRepository instead.
 */
export abstract class CouchbaseModel {
  protected abstract Struct: TcombStruct<any>
  private static couchbaseAdapter: CouchbaseAdapter

  static setCouchbaseBucket (bucket: Bucket, couchbaseAdapter: CouchbaseAdapter) {
    CouchbaseModel.couchbaseAdapter = couchbaseAdapter
  }

  get couchbaseAdapter () {
    return CouchbaseModel.couchbaseAdapter
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
        qb = (squel as any).let().field(`${prefix}.\`id\``)
        Object.keys(props).forEach(key => qb.field(`${prefix}.\`${key}\``))
        break
      case 'use':
        qb = (squel as any).useKey().field(`${prefix}.\`id\``)
        Object.keys(props).forEach(key => qb.field(`${prefix}.\`${key}\``))
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
    return (this._getMeta().defaultProps as any)._documentType
  }

  async countQuery (queryBuilder = this.getQueryBuilder('count')) {
    const [ { count } ] = await this.query(queryBuilder)

    return count
  }

  async deleteQuery (queryBuilder = this.getQueryBuilder('delete')) {
    return this.query(queryBuilder)
  }

  async queryRaw (query: string) {
    return this.couchbaseAdapter.queryAsync(query)
  }

  getBucketName () {
    return couchbase.bucket
  }

  async query (queryBuilder = this.getQueryBuilder()) {
    const queryParam = queryBuilder.toParam()

    return await this.withRetry(() =>
      this.couchbaseAdapter.queryAsync(queryParam.text, queryParam.values))
  }

  async unique (data, field) {
    const value = data[ field ]
    const query = this.getQueryBuilder().where(`${field} = ?`, value).limit(1)

    const rows = await this.query(query)

    logger.debug('model#unique', { data, field, rows })

    if (rows && rows.length) {
      // we can safely omit data with the same id
      if (data.id && data.id === rows[ 0 ].id) {
        return
      }

      const e = new DuplicatedEntity(data._documentType, field, value)
      e[ 'code' ] = 400
      throw e
    }
  }

  async findById (id) {
    if (_.isEmpty(id)) {
      throw new Error('id should be defined')
    }
    const result = await this.couchbaseAdapter.get(id)
      .catch(error => {
        if (error instanceof DocumentNotFoundError) {
          return null
        }
        throw error
      })

    if (result) {
      return fromJSON(result.content, this.Struct)
    }

    return null
  }

  async preSave (data) {
    // no pre-save operations on base model
    return data
  }

  async save (data) {
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

    await this.couchbaseAdapter.upsert(dataPreSaved.id, dataPreSaved)
    return fromJSON(dataPreSaved, this.Struct)
  }

  protected withRetry<T> (fn: () => Promise<T>): Promise<T> {
    return retry<T>(fn, {
      max_tries: 5,
      interval: 1000,
      backoff: 1.5,
      predicate: error => error instanceof TemporaryFailureError || this.isFlushBucketError(error),
    })
  }

  private isFlushBucketError (error: InternalServerFailureError) {
    return error instanceof InternalServerFailureError && error.cause && (error.cause as any).code === 205
  }
}

export class DuplicatedEntity extends Error {
  constructor (
    readonly documentType: string,
    readonly field: string,
    readonly value: string
  ) {
    super(`Value ${documentType}.${field} (${value}) cannot be duplicated`)
  }
}
