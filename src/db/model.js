import t from 'tcomb';
import Promise from 'bluebird';
import fromJSON from 'tcomb/lib/fromJSON';
import uuid from 'uuid/v4';
import squel from 'squel';
import {N1qlQuery, SearchQuery, ViewQuery} from 'couchbase';
import debug from 'debug';

import init from './couchbase';
import {couchbase, emitModelEvents} from '../../config';
import {newHttpError} from '../lib/http-error';
import {ONE_WEEK} from '../lib/constants';

const debugModel = debug('app:db:model');

class CouchbaseModelStruct {
  constructor() {
    throw new Error('you should define this.Struct as a t.struct');
  }
}

export class EmbeddedModel {
  constructor() {
    this.Struct = CouchbaseModelStruct;
  }

  getQueryBuilder() {
    throw new Error('getQueryBuilder undefined for embedded models');
  }

  async query() {
    throw new Error('query undefined for embedded models');
  }

  async preSave(data) {
    // no pre-save operations on base model
    return data;
  }

  async save(data) {
    const struct = new this.Struct(data);
    const dataWithId = t.update(struct, {id: {$set: data.id || uuid()}});
    const dataPreSaved = await this.preSave(dataWithId);
    if (!dataPreSaved) {
      throw new Error('it seems you forgot return the data on the preSave(data) method');
    }

    return dataPreSaved;
  }
}

export class CouchbaseCounter {
  constructor(bucket, options) {
    this.options = options;
    this.bucket = bucket;
  }

  async count(key, delta = 0) {
    const counterKey = `counter:${key}`;
    const {value} = await this.bucket.counterAsync(counterKey, delta, this.options);
    return value;
  }
}

export class CouchbaseSimpleCache {
  constructor(bucket, options) {
    this.bucket = bucket;
    this.options = options;
  }

  async getValue(key) {
    const cacheKey = `cache:${key}`;
    let result = null;
    if (!this.bucket) {
      return null;
    }
    try {
      result = await this.bucket.getAsync(cacheKey);
    } catch (e) {
      console.error(e);
    }

    return result && result.value;
  }

  async setValue(key, value) {
    if (!this.bucket) {
      return null;
    }
    const cacheKey = `cache:${key}`;
    return this.bucket.upsertToDb(cacheKey, value, this.options);
  }
}

export class CouchbaseModel {
  constructor() {
    CouchbaseModel.prototype._promiseBucket = CouchbaseModel.prototype._promiseBucket || init();
    this.Struct = CouchbaseModelStruct;
  }

  async findByIdOrThrow(id) {
    const model = await this.findById(id);
    if (!model) {
      throw newHttpError(404, `${this._getMeta().name} ${id} no existe`);
    }

    return model;
  }

  toStruct(data) {
    return fromJSON(data, this.Struct);
  }

  async unlock(id, cas) {
    await this._promiseBucket;
    return this._bucket.unlockAsync(id, cas);
  }

  getView(viewName) {
    return ViewQuery.from('operator', viewName);
  }

  // TODO: refactor to CouchbaseQuery
  getQueryBuilder(method = 'select', prefix = 't', props = this._getMeta().props) {
    let qb;

    switch (method) {
      case 'let':
        qb = squel.let().field(`${prefix}.\`id\``);
        Object.keys(props).forEach(key => qb.field(`${prefix}.\`${key}\``));
        break;
      case 'use':
        qb = squel.useKey().field(`${prefix}.\`id\``);
        Object.keys(props).forEach(key => qb.field(`${prefix}.\`${key}\``));
        break;
      case 'raw':
        qb = squel.select().field(`RAW ${prefix}.\`id\``);
        break;
      case 'select':
        qb = squel.select().field(`${prefix}.\`id\``);
        Object.keys(props).forEach(key => qb.field(`${prefix}.\`${key}\``));
        break;
      case 'delete':
        qb = squel.delete();
        break;
      case 'update':
        qb = squel.update();
        break;
      case 'count':
        qb = squel.select().field('COUNT(*) as count');
        break;
      default:
        throw new Error(`method ${method} not allowed (select, delete)`);
    }

    switch (method) {
      case 'update':
        qb.table(couchbase.bucket, prefix);
        break;
      default:
        qb.from(couchbase.bucket, prefix);
        break;
    }

    qb
      .where(`${prefix}.\`_documentType\` = ?`, this.getType());

    return qb;
  }

  _getMeta() {
    if (typeof this.Struct === 'undefined') {
      throw new Error([
        'Something really bad happened, Struct should be defined in some way.',
        'you miss call "await couchbase()" import from src/db/couchbase.',
        'or model types are missing move the import from src/db/couchbase top before another repositories or model.',
        'last thing go to the type model and export it as a real const and import then to your repository',
        'blame rkmax for this :P'
      ].join(' '));
    }
    if (typeof this.Struct.meta === 'undefined') {
      throw new Error('it looks like you forget define the Struct for this model or was not imported correctly');
    }
    return this.Struct.meta;
  }

  getType() {
    return this._getMeta().defaultProps._documentType;
  }

  async countQuery(queryBuilder = this.getQueryBuilder('count')) {
    const [{count}] = await this.query(queryBuilder);
    return count;
  }

  async deleteQuery(queryBuilder = this.getQueryBuilder('delete')) {
    return this.query(queryBuilder);
  }

  getSearchBuilder(queryString, indexName) {
    const name = indexName || this.getType();
    return SearchQuery.new(name, SearchQuery.queryString(queryString));
  }

  async search(searchBuilder) {
    debugModel('search', JSON.stringify(searchBuilder));
    await this._promiseBucket;

    return this._bucket.queryAsync(searchBuilder);
  }

  getCounter(options = {initial: 1}) {
    return new CouchbaseCounter(this._bucket, options);
  }

  getCache(options = {expiry: ONE_WEEK}) {
    return new CouchbaseSimpleCache(this._bucket, options);
  }

  async queryRaw(query) {
    await this._promiseBucket;
    debugModel('queryRaw', query);
    const result = await this._bucket.queryAsync(query);
    debugModel('result');
    return result;
  }

  getBucketName() {
    return couchbase.bucket;
  }

  async query(queryBuilder = this.getQueryBuilder(), consistency = couchbase.consistency) {
    await this._promiseBucket;
    const queryParam = queryBuilder.toParam();

    debugModel('query', `c(${consistency})`, queryParam);
    const n1ql = N1qlQuery.fromString(queryParam.text);
    n1ql.consistency(consistency);
    const result = await this._bucket.queryAsync(n1ql, queryParam.values);
    debugModel('query-result', `c(${consistency})`, queryParam);
    return result;
  }

  async unique(data, field) {
    const value = data[field];
    const query = this.getQueryBuilder().where(`${field} = ?`, value).limit(1);

    const result = await this.query(query);

    debugModel('result unique query ', result);

    if (result && result.length) {
      // we can safely omit data with the same id
      if (data.id && data.id === result[0].id) {
        return;
      }

      const e = new Error(`Value ${data._documentType}.${field} (${value}) cannot be duplicated`);
      e.code = 400;
      throw e;
    }
  }

  async findEmptyWorksheets() {
    const qb = this.getQueryBuilder()
      .where('ARRAY_COUNT(t.relatedBuildingIds) = 0');

    return this.query(qb);
  }

  async findByMigratedId(migratedId, required = true) {
    const qb = this.getQueryBuilder().where('t.`_migrateId` = ?', migratedId);
    const results = await this.query(qb);

    if (required && (!results || results.length === 0)) {
      throw new Error(`No records ${this._getMeta().defaultProps._documentType} found by _migrateId: ${migratedId}`);
    }

    return results;
  }

  async findOneByMigrateId(migrateId, require = true) {
    const [result] = await this.findByMigratedId(migrateId, require);
    return result;
  }

  async findById(id) {
    try {
      debugModel('findById', this._getMeta().defaultProps._documentType, id);
      await this._promiseBucket;
      const result = await this._bucket.getAsync(id);
      if (result && result.value) {
        return fromJSON(result.value, this.Struct);
      }

      return null;
    } catch (e) {
      switch (e.code) {
        case 13: // Key does not exists on the server
          return null;
        default:
          throw e;
      }
    }
  }

  async preSave(data) {
    // no pre-save operations on base model
    return data;
  }

  async postSave(data) {
    // no post-save events operations on base model
  }

  async sendEvent(eventName, data, sendEvent = emitModelEvents) {
    if (sendEvent && this._socketPromise) {
      debugModel('event', eventName, data, 'will be emitted', sendEvent);
      const socket = await this._socketPromise;
      return socket.sendEvent(eventName, data);
    } else {
      return Promise.resolve();
    }
  }

  async save(data, sendEvent) {
    // noinspection JSCheckFunctionSignatures
    const struct = fromJSON(data, this.Struct);
    const isNewData = !data.id;
    const dataWithId = t.update(struct, {id: {$set: data.id || uuid()}});
    const dataPreSaved = await this.preSave(dataWithId);

    if (!dataPreSaved) {
      throw new Error('it seems you forgot return the data on the preSave(data) method');
    }

    await this._promiseBucket;
    const result = await this._bucket.upsertToDb(dataPreSaved.id, dataPreSaved);
    // noinspection JSCheckFunctionSignatures
    const model = fromJSON(result, this.Struct);

    if (result) {
      const eventType = isNewData ? 'new' : data.id;
      await this.sendEvent(eventType, dataPreSaved, sendEvent);
      await this.postSave(model);
    }

    return model;
  }
}
