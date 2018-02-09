import t from 'tcomb';
import uuid from 'uuid/v4';
import squel from 'squel';
import {N1qlQuery} from 'couchbase';
import debug from 'debug';

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
  getQueryBuilder(method = 'select') {
    let qb;

    switch (method) {
      case 'select':
        qb = squel.select().field('t.`id`');
        Object.keys(this.Struct.meta.props).forEach(key => qb.field(`t.\`${key}\``));
        break;
      case 'delete':
        qb = squel.delete();
        break;
      default:
        throw new Error(`method ${method} not allowed (select, delete)`);
    }

    qb
      .from(this._bucketName, 't')
      .where('t.`_documentType` = ?', this.Struct.meta.defaultProps._documentType);

    return qb;
  }

  async deleteQuery(queryBuilder = this.getQueryBuilder('delete')) {
    return this.query(queryBuilder);
  }

  async query(queryBuilder = this.getQueryBuilder(), consistency = N1qlQuery.Consistency.STATEMENT_PLUS) {
    const queryParam = queryBuilder.toParam();
    debugModel('query', queryParam);
    const n1ql = N1qlQuery.fromString(queryParam.text);
    n1ql.consistency(consistency);

    return this._bucket.queryAsync(n1ql, queryParam.values);
  }

  async unique(data, field) {
    const value = data[field];
    const query = this.getQueryBuilder().where(`${field} = ?`, value);

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
      const result = await this._bucket.getAsync(id);
      if (result && result.value) {
        return new this.Struct(result.value);
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

  async save(data) {
    const struct = new this.Struct(data);
    const dataWithId = t.update(struct, {id: {$set: data.id || uuid()}});
    const dataPreSaved = await this.preSave(dataWithId);
    if (!dataPreSaved) {
      throw new Error('it seems you forgot return the data on the preSave(data) method');
    }
    await this._bucket._promise;
    return this._bucket.upsertToDb(dataPreSaved.id, dataPreSaved);
  }
}
