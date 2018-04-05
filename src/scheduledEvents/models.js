import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import _get from 'lodash/get';
import {CouchbaseModel} from '../db/model';
import {
  addDateQueryToBuilder,
  addMinuteDateQueryToBuilder,
  addBetweenQueryToBuilder
} from '../lib/query/helpers';
import {newHttpError} from '../lib/http-error';
import {buildRangeFromWeek, meetingWeekFormat, utc} from '../lib/date';
import {buildDistanceCalculator} from '../lib/geo';
import {getScheduledMeetingStruct} from './helper';
import firebase from '../firebase';
import {
  deleteMeetingToBuilding,
  deleteMeetingToFirebase,
  deleteMeetingToOperator,
  relateMeetingToBuilding,
  relateMeetingToOperator,
  saveBuildingToFirebase,
  saveMeetingToFirebase
} from '../firebase/lib';
import {OwnerRepository} from '../owner/models';

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
      const person = t.Person(owner.person);
      meetingObj['contact'] = {
        name: person.fullName(),
        phone: person.findContactValueById(contactId)
      };
      meetingObj['building'] = owner.building;
    }

    return t.Meeting(meetingObj);
  }

  async firebaseMeeting(scheduleEvent) {
    const db = firebase.database();
    const meeting = await this.findMeeting(scheduleEvent);
    const {building} = meeting;

    await saveBuildingToFirebase(db, building);
    await saveMeetingToFirebase(db, meeting);
    await relateMeetingToBuilding(db, meeting);
    await relateMeetingToOperator(db, meeting, meeting.notifyTo);
  }

  async deleteFirebaseMeeting(scheduleEvent) {
    const db = firebase.database();
    const meeting = await this.findMeeting(scheduleEvent);
    await deleteMeetingToFirebase(db, meeting);
    await deleteMeetingToBuilding(db, meeting);
    await deleteMeetingToOperator(db, meeting, meeting.notifyTo);
  }

  async addScheduledMeetingEvent(data = {}) {
    const scheduledEventBody = await getScheduledMeetingStruct(Object.assign({}, data, {type: 'MEETINGS'}));
    const scheduledEvent = await this.save(scheduledEventBody);
    await this.firebaseMeeting(scheduledEvent);

    return scheduledEvent;
  }

  async update(id, data = {}) {
    const updateData = data;
    const scheduleEvent = await this.findByIdOrThrow(id);
    updateData.notifyAt = updateData.notifyAt ? new Date(updateData.notifyAt) : scheduleEvent.notifyAt;
    updateData.eventDate = updateData.eventDate ? new Date(updateData.eventDate) : scheduleEvent.eventDate;
    const changes = t.UpdateScheduledEvent(updateData);
    const updatedScheduledEvent = t.update(scheduleEvent, {$merge: changes});

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

  async postSave(scheduleEvent) {
    return this.sendWeekEvent(scheduleEvent);
  }
}
