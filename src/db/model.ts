import t, { Struct as TcombStruct } from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'
import squel from 'squel'
import { Bucket, Cluster, QueryScanConsistency, TemporaryFailureError } from 'couchbase'
import _ from 'lodash'
import { logger } from '../infrastructure/logger'
import { validate } from 'tcomb-validation'

import { couchbase } from '../../config'
import { newHttpError } from '../lib/http-error'
import { WrongStructRecord } from '../infrastructure/wrong-struct-record.error'
import retry from 'bluebird-retry'

class CouchbaseModelStruct {
    constructor() {
        throw new Error('you should define this.Struct as a t.struct')
    }
}


/**
 * @deprecated use CouchbaseRepository instead.
 */
export class CouchbaseModel {
    protected Struct?: TcombStruct<any>
    private static bucket: Bucket
    private static cluster: Cluster

    constructor() {
    }

    static setCouchbaseBucket(bucket: Bucket) {
        CouchbaseModel.bucket = bucket
        CouchbaseModel.cluster = bucket.cluster
    }

    async findByIdOrThrow(id) {
        const model = await this.findById(id)
        if (!model) {
            throw newHttpError(404, `${this._getMeta().name} ${id} no existe`)
        }

        return model
    }

    getQueryBuilder(method = 'select', prefix = 't', props = this._getMeta().props) {
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

    _getMeta() {
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

    getType() {
        return (this._getMeta().defaultProps as any)._documentType
    }

    async countQuery(queryBuilder = this.getQueryBuilder('count')) {
        const [ { count } ] = await this.query(queryBuilder)

        return count
    }

    async deleteQuery(queryBuilder = this.getQueryBuilder('delete')) {
        return this.query(queryBuilder)
    }

    async queryRaw(query: string) {
        try {
            const result = await this.withRetry(() => CouchbaseModel.cluster.query(query))
            logger.debug('model#queryRaw', { query, result })

            return result
        } catch (error) {
            logger.error('model#queryRaw', { query, error })
            throw error
        }
    }

    getBucketName() {
        return couchbase.bucket
    }

    async query(queryBuilder = this.getQueryBuilder()) {
        const queryParam = queryBuilder.toParam()

        try {
            const query = queryParam.text
            const result = await this.withRetry(() => CouchbaseModel.cluster.query(query, {
                parameters: queryParam.values,
                scanConsistency: QueryScanConsistency.RequestPlus
            }))
            logger.debug('model#query', { queryParam, result })

            return result.rows
        } catch (error) {
            logger.error('model#query', { queryParam, error })
            throw error
        }
    }

    async unique(data, field) {
        const value = data[field]
        const query = this.getQueryBuilder().where(`${field} = ?`, value).limit(1)

        const rows = await this.query(query)

        logger.debug('model#unique', { data, field, rows })

        if (rows && rows.length) {
            // we can safely omit data with the same id
            if (data.id && data.id === rows[0].id) {
                return
            }

            const e = new Error(`Value ${data._documentType}.${field} (${value}) cannot be duplicated`)
            e['code'] = 400
            throw e
        }
    }

    async findById(id) {
        if (_.isEmpty(id)) {
            throw new Error('id should be defined')
        }
        try {
            logger.debug('findById', {
                documentType: this.getDocumentType(),
                id
            })
            const result = await this.withRetry(() => CouchbaseModel.bucket.defaultCollection().get(id))
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

    private getDocumentType() {
        return (this._getMeta().defaultProps as any)._documentType
    }

    async preSave(data) {
        // no pre-save operations on base model
        return data
    }

    async save(data, sendEvent, opts = {}) {
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

        const result = await this.withRetry(
            () => CouchbaseModel.bucket.defaultCollection().upsert(dataPreSaved.id, dataPreSaved, opts)
        )
        return fromJSON(dataPreSaved, this.Struct)
    }

    withRetry<T>(fn: () => T): Promise<T> {
        return retry(fn, {
            maxTries: 3,
            interval: 100,
            predicate: error => error instanceof TemporaryFailureError || error.message.includes('Indexer rollback from')
        })
    }
}
