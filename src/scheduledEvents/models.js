import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import {CouchbaseModel} from '../db/model';
import {
  addDateQueryToBuilder,
  addBetweenQueryToBuilder
} from '../lib/query/helpers';
import {newHttpError} from '../lib/http-error';

export class ScheduledEvents extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.ScheduledEvent;
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

  async update(id, data = {}) {
    const changes = t.UpdateScheduledEvent(data);
    const scheduleEvent = await this.findByIdOrThrow(id);
    const updatedscheduledEvent = t.update(scheduleEvent, {$merge: changes});

    return this.save(updatedscheduledEvent);
  }

  async delete(id) {
    const qb = this.getQueryBuilder('delete')
      .where('id = ?', id);
      
    return this.query(qb);
  }

  async list(query = {}) {
    const params = new t.ScheduledEventListQuery(query);
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset);
    const qbCount = this.getQueryBuilder('count');

    if (params.userId) {
      qb.where('userId = ?', params.userId);
      qbCount.where('userId = ?', params.userId);
    }

    if (params.createdAt) {
      addDateQueryToBuilder(qb, 'date', params.createdAt);
      addDateQueryToBuilder(qbCount, 'date', params.createdAt);
    } else if (params.notifyAt) {
      addDateQueryToBuilder(qb, 'notifyAt', params.notifyAt);
      addDateQueryToBuilder(qbCount, 'notifyAt', params.notifyAt);
    } else if (params.notifyBetween) {
      addBetweenQueryToBuilder(qb, 'date', params.notifyBetween);
      addBetweenQueryToBuilder(qbCount, 'date', params.notifyBetween);
    } else if (params.createdBetween) {
      addBetweenQueryToBuilder(qb, 'notifyAt', params.createdBetween);
      addBetweenQueryToBuilder(qbCount, 'notifyAt', params.createdBetween);
    }
    const total = await this.countQuery(qbCount);
    const results = await this.query(qb);

    return fromJSON({total, results}, t.ScheduleEventsListResponse);
  }
}
