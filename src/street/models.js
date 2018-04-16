import t from 'tcomb';
import './types';
import {CouchbaseModel} from '../db/model';
import {locationPointView} from './views';

export class Neighborhood extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.Neighborhood;
  }
}

export class NeighborhoodRepository extends Neighborhood {
  async listFiltered(city, neighborhood) {
    const qb = this.getQueryBuilder();
    if (city) {
      qb.where('city = ?', city);
    }

    if (neighborhood) {
      qb.where('name = ?', neighborhood);
    }

    const result = await this.query(qb);

    return result.map(locationPointView);
  }
}

export class City extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.City;
  }
}

export class CityRepository extends City {

}
