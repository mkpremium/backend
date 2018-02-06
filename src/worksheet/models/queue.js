import t from 'tcomb';
import {CouchbaseModel} from '../../db/model';

export class WorksheetQueue extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.WorksheetQueue;
  }
}

export class WorksheetQueueRepository extends WorksheetQueue {
  async findByCity(name) {
    const qb = this.getQueryBuilder()
      .where('city = ?', name)
      .limit(1);
    const [city] = await this.query(qb);

    if (!city) {
      const e = new Error(`Cola para ciudad ${name} no encontrada`);
      e.code = 404;
      throw e;
    }

    return new this.Struct(city);
  }
}
