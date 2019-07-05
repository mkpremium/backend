
import {CouchbaseModel} from '../db/model';
import {Stock} from './types';
import fromJSON from 'tcomb/lib/fromJSON';
import _head from 'lodash/head';
import t from 'tcomb';

export class StockRepository extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = Stock;
  }

  async findByBuildingId(buildingId) {
    const qb = this.getQueryBuilder()
      .where('t.`buildingId` = ? ', buildingId);

    const results = await this.query(qb);

    if (results.length > 0) {
      return fromJSON(_head(results), Stock);
    }
  }

  async findByBuildingIdOrThrow(buildingId) {
    const result = await this.findByBuildingId(buildingId);
    if (!result) {
      throw new Error(`No existe un stock asociado a ${buildingId}`);
    }
    return result;
  }
}
