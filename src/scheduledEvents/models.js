import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import {CouchbaseModel} from '../../db/model';
import {
  addDateQueryToBuilder,
  addBetweenQueryToBuilder
} from './helper';
import {newHttpError} from '../../lib/http-error';

export class ScheduledEvents extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.ScheduledEvents;
  }
}

export class ScheduledEventsRepository extends ScheduledEvents {
  async findByIdOrThrow(id) {
    const scheduledEvent = await this.findById(id);
    if (!scheduledEvent) {
      throw newHttpError(404, `Evento programado ${id} no existe`);
    }

    return scheduledEvent;
  }

  async list(query = {}) {
    const params = new t.ScheduledEventListQuery(query);
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset);
    const qbCount = this.getQueryBuilder('count');

    if (params.createdAt) {
      addDateQueryToBuilder(qb, params.createdAt, 'date');
      addDateQueryToBuilder(qbCount, params.createdAt, 'date');
    } else if (params.notifyAt) {
      addDateQueryToBuilder(qb, params.notifyAt, 'notifyAt');
      addDateQueryToBuilder(qbCount, params.notifyAt, 'notifyAt');
    } else if (params.notifyBetween) {
      addBetweenQueryToBuilder(qb, params.notifyBetween, 'date');
      addBetweenQueryToBuilder(qbCount, params.notifyBetween, 'date');
    } else if (params.createdBetween) {
      addBetweenQueryToBuilder(qb, params.createdBetween, 'notifyAt');
      addBetweenQueryToBuilder(qbCount, params.createdBetween, 'notifyAt');
    }

    const total = await this.countQuery(qbCount);
    const results = await this.query(qb);

    return fromJSON({total, results}, t.ScheduleEventsListResponse);
  }
}
