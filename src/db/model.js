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

export class CouchbaseModel {
  constructor() {
    this.Struct = CouchbaseModelStruct;
  }

  // TODO: refactor to CouchbaseQuery
  getQueryBuilder() {
    const qb = squel
      .select()
      .field('t.`id`')
      .from(this._bucketName, 't')
      .where('t.`_documentType` = ?', this.Struct.meta.defaultProps._documentType);

    Object.keys(this.Struct.meta.props).forEach(key => qb.field(`t.\`${key}\``));

    return qb;
  }

  async query(_query) {
    const queryParam = _query.toParam();
    debugModel('query', queryParam);
    return this._bucket.queryAsync(N1qlQuery.fromString(queryParam.text), queryParam.values);
  }

  async unique(data, field) {
    const value = data[field];
    const query = this.getQueryBuilder().where(`${field} = ?`, value);

    const result = await this.query(query);
    if (result && result.length) {
      const e = new Error(`Value ${data._documentType}.${field} (${value}) cannot be duplicated`);
      e.code = 400;
      throw e;
    }
  }

  async preSave() {
    // no pre-save operations on base model
  }

  async save(data) {
    const struct = new this.Struct(data);
    const dataWithId = t.update(struct, {id: {$set: data.id || uuid()}});
    const dataPreSaved = await this.preSave(dataWithId);
    if (!dataPreSaved) {
      throw new Error('it seems you forgot return the data on the preSave(data) method');
    }
    return this._bucket.upsertToDb(dataPreSaved.id, dataPreSaved);
  }
}
