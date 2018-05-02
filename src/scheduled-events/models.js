import debug from 'debug';
import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import _get from 'lodash/get';
import _pick from 'lodash/pick';
import _identity from 'lodash/identity';
import {CouchbaseModel} from '../db/model';
import {
  addDateQueryToBuilder,
  addMinuteDateQueryToBuilder,
  addBetweenQueryToBuilder,
  addMinuteBetweenQueryToBuilder
} from '../lib/query/helpers';
import {newHttpError} from '../lib/http-error';
import {buildRangeFromWeek, meetingWeekFormat, utc} from '../lib/date';
import {buildDistanceCalculator} from '../lib/geo';
import {fbComerciales} from '../firebase';
import {
  deleteMeetingToBuilding,
  deleteMeetingToFirebase,
  deleteMeetingToOperator,
  relateMeetingToBuilding,
  relateMeetingToOperator,
  saveBuildingToFirebase,
  saveMeetingToFirebase
} from '../firebase/lib/business';
import {OwnerRepository} from '../owner/models';
import {ScheduledEventType} from './types';

function onlyWithValues(obj) {
  return _pick(obj, _identity);
}

const debugModel = debug('app:model:scheduled-events');

export class ScheduledEvents extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.ScheduledEvent;
  }
}

export class ScheduledTask extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.ScheduledTask;
  }
}

export class ScheduledTaskRepository extends ScheduledTask {
  static async scheduleNewTask(when, type, context) {
    const [amount, units] = when.split(' ');
    const executeAt = utc().add(Number(amount), units);
    const newTask = {
      type,
      context,
      executeAt
    };
    const repo = new ScheduledTaskRepository();
    return repo.save(newTask);
  }

  async findTasksToExecute(executeAt) {
    const qb = this.getQueryBuilder();
    addMinuteDateQueryToBuilder(qb, 'executeAt', executeAt);
    return this.query(qb);
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

  // noinspection JSMethodCanBeStatic
  async findMeeting(scheduleEvent) {
    const meetingObj = {
      id: scheduleEvent.id,
      notifyTo: scheduleEvent.notifyTo,
      createdAt: scheduleEvent.createdAt,
      createdBy: scheduleEvent.createdBy,
      eventDate: scheduleEvent.eventDate,
      address: _get(scheduleEvent, 'event.eventAddress')
    };
    const ownerId = _get(scheduleEvent, 'event.ownerId');
    const contactId = _get(scheduleEvent, 'event.contactId');

    const ownerRepo = new OwnerRepository();

    const [owner] = ownerId
      ? await ownerRepo.findByIdWithIncludes(ownerId, ['person', 'building'])
      : [];
    if (owner) {
      meetingObj['owner'] = owner;
      const person = fromJSON(owner.person, t.Person);
      meetingObj['contact'] = {
        name: person.fullName(),
        phone: person.findContactValueById(contactId)
      };
      meetingObj['building'] = owner.building;
    }

    return fromJSON(meetingObj, t.Meeting);
  }

  async firebaseMeeting(scheduleEvent) {
    const db = fbComerciales.database();
    const meeting = await this.findMeeting(scheduleEvent);
    const {building, owner} = meeting;

    await saveBuildingToFirebase(db, building, owner);
    await saveMeetingToFirebase(db, meeting);
    await relateMeetingToBuilding(db, meeting);
    await relateMeetingToOperator(db, meeting, meeting.notifyTo);
  }

  async deleteFirebaseMeeting(scheduleEvent) {
    const db = fbComerciales.database();
    const meeting = await this.findMeeting(scheduleEvent);
    await deleteMeetingToFirebase(db, meeting);
    await deleteMeetingToBuilding(db, meeting);
    await deleteMeetingToOperator(db, meeting, meeting.notifyTo);
  }

  async validateMeeting(data) {
    if (data.type !== ScheduledEventType.MEETINGS) {
      return true;
    }

    if (!areAllowedMeetingMins(data.eventDate)) {
      throw newHttpError(
        400,
        `Las reuniones solo puede empezar a los 00 minutos o 30 minutos UTC: ${data.eventDate}|${data.eventDate.toISOString()}`
      );
    }

    const m = utc(data.eventDate);
    const start = m.clone().subtract(1.5, 'hours').toISOString();
    const end = m.clone().add(1.5, 'hours').toISOString();
    console.log('areAllowedMeetingInRange', data.eventDate, start, end);
    const meetingsInRange = await this.findMeetingInRange(data.eventDate, start, end);
    if (meetingsInRange && meetingsInRange.length > 0) {
      throw newHttpError(
        400,
        'Las reuniones no pueden solaparse, tiene una duración de 1h y deben tener 30 minutos entre ellas'
      );
    }
    return true;
  }

  async findMeetingInRange(notifyTo, start, end) {
    const qb = this.getQueryBuilder();
    const eventDate = [start, end].join(',');
    addMinuteBetweenQueryToBuilder(qb, 'eventDate', eventDate);
    qb.where('type = ?', ScheduledEventType.MEETINGS);
    return this.query(qb);
  }

  async addScheduledMeetingEvent(data = {}, createdBy) {
    const params = Object.assign({}, data, {createdBy, type: 'MEETINGS'});
    const scheduledEvent = await this.save(params);
    await this.firebaseMeeting(scheduledEvent);

    return scheduledEvent;
  }

  async addScheduleCallEvent(data = {}, createdBy) {
    const params = Object.assign({}, data, {createdBy, type: 'CALLS'});
    return this.save(params);
  }

  async update(id, data = {}) {
    debugModel('update', id, data);
    const scheduleEvent = await this.findByIdOrThrow(id);
    const changes = fromJSON(data, t.UpdateScheduledEvent);
    const updatedEvent = t.update(scheduleEvent.event, {
      $merge: onlyWithValues(changes.event)
    });
    const updatedScheduledEvent = t.update(scheduleEvent, {
      $merge: onlyWithValues({
        notifyAt: changes.notifyAt,
        eventDate: changes.eventDate,
        event: updatedEvent
      })
    });

    await this.deleteFirebaseMeeting(scheduleEvent);
    await this.firebaseMeeting(updatedScheduledEvent);

    return this.save(updatedScheduledEvent);
  }

  async delete(id) {
    const scheduleEvent = await this.findByIdOrThrow(id);
    await this.deleteFirebaseMeeting(scheduleEvent);
    const qb = this.getQueryBuilder('delete').where('id = ?', id);
    await this.sendWeekEvent(scheduleEvent);
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
    addBetweenQueryToBuilder(qb, 'eventDate', rangeWeek);
    qb.where('type = ?', 'MEETINGS');

    const results = await this.query(qb);
    if (location) {
      return results.map(buildDistanceCalculator(location, 'event.eventLocation'));
    } else {
      return results;
    }
  }

  async sendWeekEvent(scheduleEvent) {
    const week = meetingWeekFormat(scheduleEvent.eventDate);
    return this.sendEvent(week, scheduleEvent);
  }

  async preSave(scheduleEvent) {
    await this.validateMeeting(scheduleEvent);
    const ownerId = _get(scheduleEvent, 'event.ownerId');
    if (ownerId) {
      const ownerRepo = new OwnerRepository();
      const [owner] = await ownerRepo.findByIdWithIncludes(ownerId, ['person', 'building']);
      if (owner) {
        const updatedEvent = t.update(scheduleEvent.event, {$merge: {owner}});
        return t.update(scheduleEvent, {event: {$set: updatedEvent}});
      }
    }
    return scheduleEvent;
  }

  async postSave(scheduleEvent) {
    return this.sendWeekEvent(scheduleEvent);
  }
}

function areAllowedMeetingMins(time) {
  const min = time.getMinutes();

  if (min === 0) {
    return true;
  }

  if (min === 30) {
    return true;
  }

  return false;
}
