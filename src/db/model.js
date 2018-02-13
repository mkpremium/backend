import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import uuid from 'uuid/v4';
import squel from 'squel';
import {N1qlQuery} from 'couchbase';
import debug from 'debug';
import socket from '../socket/client';

import {couchbase} from '../../config';

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

export class CouchbaseModel {
  constructor() {
    this.Struct = CouchbaseModelStruct;
  }

  // TODO: refactor to CouchbaseQuery
  getQueryBuilder(method = 'select', prefix = 't') {
    let qb;

    switch (method) {
      case 'let':
        qb = squel.let().field(`${prefix}.\`id\``);
        Object.keys(this.Struct.meta.props).forEach(key => qb.field(`${prefix}.\`${key}\``));
        break;
      case 'use':
        qb = squel.useKey().field(`${prefix}.\`id\``);
        Object.keys(this.Struct.meta.props).forEach(key => qb.field(`${prefix}.\`${key}\``));
        break;
      case 'select':
        qb = squel.select().field(`${prefix}.\`id\``);
        Object.keys(this.Struct.meta.props).forEach(key => qb.field(`${prefix}.\`${key}\``));
        break;
      case 'delete':
        qb = squel.delete();
        break;
      case 'count':
        qb = squel.select().field('COUNT(*) as count');
        break;
      default:
        throw new Error(`method ${method} not allowed (select, delete)`);
    }

    qb
      .from(couchbase.bucket, prefix)
      .where(`${prefix}.\`_documentType\` = ?`, this.Struct.meta.defaultProps._documentType);

    return qb;
  }

  async countQuery(queryBuilder = this.getQueryBuilder('count')) {
    const [{count}] = await this.query(queryBuilder);
    return count;
  }

  async deleteQuery(queryBuilder = this.getQueryBuilder('delete')) {
    return this.query(queryBuilder);
  }

  async query(queryBuilder = this.getQueryBuilder(), consistency = couchbase.consistency) {
    const queryParam = queryBuilder.toParam();
    debugModel('query', `c(${consistency})`, queryParam);
    const n1ql = N1qlQuery.fromString(queryParam.text);
    n1ql.consistency(consistency);
    await this._promiseBucket;
    return this._bucket.queryAsync(n1ql, queryParam.values);
  }

  async unique(data, field) {
    const value = data[field];
    const query = this.getQueryBuilder().where(`${field} = ?`, value).limit(1);

    const result = await this.query(query);

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

  async findById(id) {
    try {
      debugModel('findById', this.Struct.meta.defaultProps._documentType, id);
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

  async save(data, sendEvent = false) {
    const struct = new this.Struct(data);
    const isNewData = !data.id;
    const dataWithId = t.update(struct, {id: {$set: data.id || uuid()}});
    const dataPreSaved = await this.preSave(dataWithId);
    if (!dataPreSaved) {
      throw new Error('it seems you forgot return the data on the preSave(data) method');
    }
    await this._promiseBucket;
    const result = this._bucket.upsertToDb(dataPreSaved.id, dataPreSaved);
    
    if (result && sendEvent) {
      const eventType = isNewData ? 'add' : 'update';
      await socket.sendEvent(eventType, dataPreSaved);
    }

    return result;
  }
}
