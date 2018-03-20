import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import {CouchbaseModel} from '../db/model';
import {
  addDateQueryToBuilder,
  addMinuteDateQueryToBuilder,
  addBetweenQueryToBuilder
} from '../lib/query/helpers';
import {newHttpError} from '../lib/http-error';
import {buildRangeFromWeek, utc} from '../lib/date';
import {buildDistanceCalculator} from '../lib/geo';

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
    const updateData = data;
    const scheduleEvent = await this.findByIdOrThrow(id);
    updateData.notifyAt = updateData.notifyAt ? new Date(updateData.notifyAt) : scheduleEvent.notifyAt;
    updateData.eventDate = updateData.eventDate ? new Date(updateData.eventDate) : scheduleEvent.eventDate;
    const changes = t.UpdateScheduledEvent(updateData);
    const updatedscheduledEvent = t.update(scheduleEvent, {$merge: changes});

    return this.save(updatedscheduledEvent);
  }

  async delete(id) {
    const qb = this.getQueryBuilder('delete')
      .where('id = ?', id);

    return this.query(qb);
  }

  async list(query = {}) {
    const params = t.ScheduledEventListQuery(query);
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset);
    const qbCount = this.getQueryBuilder('count');

    if (params.createdBy) {
      qb.where('createdBy = ?', params.createdBy);
      qbCount.where('createdBy = ?', params.createdBy);
    }

    if (params.type) {
      qb.where('type = ?', params.type);
      qbCount.where('type = ?', params.type);
    }

    if (params.createdAt) {
      addDateQueryToBuilder(qb, 'createdAt', params.createdAt);
      addDateQueryToBuilder(qbCount, 'createdAt', params.createdAt);
    } else if (params.notifyAt) {
      addMinuteDateQueryToBuilder(qb, 'notifyAt', params.notifyAt);
      addMinuteDateQueryToBuilder(qbCount, 'notifyAt', params.notifyAt);
    } else if (params.eventDate) {
      addDateQueryToBuilder(qb, 'eventDate', params.eventDate);
      addDateQueryToBuilder(qbCount, 'eventDate', params.eventDate);
    } else if (params.eventDateBetween) {
      addBetweenQueryToBuilder(qb, 'eventDate', params.eventDateBetween);
      addBetweenQueryToBuilder(qbCount, 'eventDate', params.eventDateBetween);
    } else if (params.notifyBetween) {
      addBetweenQueryToBuilder(qb, 'notifyAt', params.notifyBetween);
      addBetweenQueryToBuilder(qbCount, 'notifyAt', params.notifyBetween);
    } else if (params.createdBetween) {
      addBetweenQueryToBuilder(qb, 'createdAt', params.createdBetween);
      addBetweenQueryToBuilder(qbCount, 'createdAt', params.createdBetween);
    }
    const total = await this.countQuery(qbCount);
    const results = await this.query(qb);

    return fromJSON({total, results}, t.ScheduleEventsListResponse);
  }

  async weekScheduleEventMeetings(week, year, location) {
    const now = utc();
    const y = year || now.year();
    const w = week || now.week();
    const rangeWeek = buildRangeFromWeek(w, y);

    const qb = this.getQueryBuilder();
    addBetweenQueryToBuilder(qb, rangeWeek);
    qb.where('type = ?', 'MEETINGS');

    const results = await this.query(qb);
    if (location) {
      return results.map(buildDistanceCalculator(location, 'event.eventLocation'));
    } else {
      return results;
    }
  }
}
