
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

    return fromJSON(_head(results), Stock);
  }
}
