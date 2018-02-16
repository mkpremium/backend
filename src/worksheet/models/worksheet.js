import t from 'tcomb';
import {CouchbaseModel} from '../../db/model';
import {utc} from '../../lib/date';

export class Worksheet extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.WorkSheet;
  }
}

export class WorksheetRepository extends Worksheet {
  async list(query = {}) {
    const params = new t.WorksheetListQuery(query);
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset);
    const qbCount = this.getQueryBuilder('count');

    if (params.status) {
      qb.where('status = ?', params.status);
      qbCount.where('status = ?', params.status);
    }

    if (params.viewedAt) {
      const m = utc(params.viewedAt);
      qb.where('viewedAt >= ?', m.clone().startOf('day').toDate());
      qbCount.where('viewedAt <= ?', m.clone().endOf('day').toDate());
    } else {
      const [start, end] = params.viewedBetween.split(',').map(d => d ? utc(d) : d);
      if (start) {
        qb.where('viewedAt >= ?', start.startOf('day').toDate());
        qbCount.where('viewedAt >= ?', start.startOf('day').toDate());
      }
      if (end) {
        qb.where('viewedAt <= ?', end.endOf('day').toDate());
        qbCount.where('viewedAt <= ?', end.endOf('day').toDate());
      }
    }

    const total = await this.countQuery(qbCount);
    const results = await this.query(qb);

    return t.WorkSheetLitResponse({total, results});
  }
}
