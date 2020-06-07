import debug from 'debug'
import _get from 'lodash/get'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { CouchbaseModel } from '../db/model'
import { buildRangeFromWeek, meetingWeekFormat, utc } from '../lib/date'
import { buildDistanceCalculator } from '../lib/geo'
import { newHttpError } from '../lib/http-error'
import {
  addBetweenQueryToBuilder,
  addDateQueryToBuilder,
  addMinuteBetweenQueryToBuilder,
  addMinuteDateQueryToBuilder
} from '../lib/query/helpers'
import { OwnerRepository } from '../owner/models'
import { OperatorStats } from '../stats/models'
import { OperatorActions } from '../stats/types'
import { SystemPreferencesRepository } from '../system-preferences/models'
import { WorksheetRepository } from '../worksheet/models/worksheet'
import { ScheduledEvent, ScheduledEventType } from './types'

const debugModel = debug('app:model:scheduled-events')

export class ScheduledEvents extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = ScheduledEvent
  }
}

export class ScheduledTask extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = t.ScheduledTask
  }
}

export class ScheduledTaskRepository extends ScheduledTask {
  static async scheduleNewTask (when, type, context) {
    const [amount, units] = when.split(' ')
    const executeAt = utc().add(Number(amount), units)
    const newTask = {
      type,
      context,
      executeAt
    }
    const repo = new ScheduledTaskRepository()
    return repo.save(newTask)
  }

  async findTasksToExecute (executeAt) {
    const qb = this.getQueryBuilder()
    addMinuteDateQueryToBuilder(qb, 'executeAt', executeAt)
    return this.query(qb)
  }
}

export class ScheduledEventsRepository extends ScheduledEvents {
  async findByIdOrThrow (id) {
    const scheduledEvent = await this.findById(id)
    if (!scheduledEvent) {
      throw newHttpError(404, `Evento programado ${id} no existe`)
    }

    return scheduledEvent
  }

  async firebaseMeeting (scheduleEvent) {
    const repo = new OwnerRepository()
    const ownerId = _get(scheduleEvent, 'event.ownerId')
    await repo.initialBusinessStatus(ownerId, scheduleEvent.notifyTo)
  }

  static async firebaseMeetingById (meetingId) {
    const repo = new ScheduledEventsRepository()
    const meeting = await repo.findByIdOrThrow(meetingId)
    return repo.firebaseMeeting(meeting)
  }

  async validateMeeting (data) {
    if (data.type !== ScheduledEventType.MEETINGS) {
      return true
    }
    // non presencial meetings necesitan validación de tiempo y fecha

    if (!data.event.inPerson) {
      return true
    }

    const pref = await SystemPreferencesRepository.getPreferences()

    if (!pref.meetingRestrictions.enable) {
      return true
    }

    if (!areAllowedMeetingMinutes(data.eventDate, pref.meetingRestrictions.allowedStartMinutes)) {
      throw newHttpError(
        400,
        `Las reuniones solo puede empezar a los 00 minutos o 30 minutos UTC: ${data.eventDate}|${data.eventDate.toISOString()}`
      )
    }

    const previousTime = pref.meetingRestrictions.meetingTime + pref.meetingRestrictions.timeBetweenMeeting
    const meetingTime = pref.meetingRestrictions.meetingTime
    const m = utc(data.eventDate)
    const start = m.clone().subtract(previousTime, 'hours').toISOString()
    const end = m.clone().add(meetingTime, 'hours').toISOString()
    console.log('areAllowedMeetingInRange', data.eventDate, start, end)
    const meetingsInRange = await this.findMeetingInRange(data.notifyTo, start, end, data.id)
    if (meetingsInRange && meetingsInRange.length > 0) {
      throw newHttpError(
        400,
        'Las reuniones no pueden solaparse, tiene una duración de 1h y deben tener 30 minutos entre ellas'
      )
    }
    return true
  }

  async findMeetingInRange (notifyTo, start, end, scheduleId) {
    const qb = this.getQueryBuilder()
    const eventDate = [start, end].join(',')
    addMinuteBetweenQueryToBuilder(qb, 'eventDate', eventDate)
    qb.where('type = ?', ScheduledEventType.MEETINGS)
    qb.where('notifyTo = ?', notifyTo)
    if (scheduleId) {
      qb.where('id != ?', scheduleId)
    }
    return this.query(qb)
  }

  async addScheduledMeetingEvent (data = {}, createdBy) {
    const params = Object.assign({}, data, { createdBy, type: 'MEETINGS' })
    await this.validateUniqueWorksheet(params)
    const scheduledEvent = await this.save(params)

    if (_get(scheduledEvent, 'event.worksheetId')) {
      const worksheetRepo = new WorksheetRepository()
      const worksheet = await worksheetRepo.findByIdWIthIncludes(_get(scheduledEvent, 'event.worksheetId'))
      const { city, province } = _get(worksheet, 'relatedBuildings.0.address', {})
      const updatedWorksheet = t.update(worksheet, { lastAddedMeeting: { $set: scheduledEvent } })
      await worksheetRepo.save(updatedWorksheet, false)
      if (worksheet.lastAddedMeeting === null) {
        const action = _get(scheduledEvent, 'event.inPerson') ? OperatorActions.MEETING : OperatorActions.NON_PRESENTIAL_MEETING
        await OperatorStats.registerAction(createdBy, action, { city, province })
        await OperatorStats.registerAction(data.notifyTo, OperatorActions.BUSINESS_MEETING, { city, province })
      }
    }

    try {
      await this.firebaseMeeting(scheduledEvent)
    } catch (e) {
      console.error(e)
    }

    return scheduledEvent
  }

  async findAllMeetings () {
    const qb = this.getQueryBuilder()
      .where('type = ?', ScheduledEventType.MEETINGS)
    return this.query(qb)
  }

  async validateUniqueWorksheet (params) {
    const worksheetId = _get(params, 'event.worksheetId')
    const type = _get(params, 'type')

    if (!worksheetId) {
      return
    }

    const qb = this.getQueryBuilder()
      .where('event.worksheetId = ?', worksheetId)
      .where('type = ?', type)
    const result = await this.query(qb)

    if (result && result.length > 0) {
      throw newHttpError(400, 'No se pueden crear multiples citas para una misma worksheet')
    }
  }

  async addScheduleCallEvent (data = {}, createdBy) {
    const params = Object.assign({}, data, { createdBy, type: 'CALLS' })
    return this.save(params)
  }

  async update (id, data = {}) {
    debugModel('update', id, data)
    const scheduledEvent = await this.findByIdOrThrow(id)
    fromJSON(data, t.UpdateScheduledEvent)
    const updatedEvent = t.update(scheduledEvent.event, {
      $merge: data.event
    })
    const updatedScheduledEventData = t.update(scheduledEvent, {
      $merge: {
        notifyAt: data.notifyAt,
        eventDate: data.eventDate,
        event: updatedEvent
      }
    })

    const updatedScheduledEvent = await this.save(updatedScheduledEventData)
    await this.firebaseMeeting(updatedScheduledEvent)

    return updatedScheduledEvent
  }

  async delete (id) {
    const scheduledEvent = await this.findByIdOrThrow(id)
    const qb = this.getQueryBuilder('delete').where('id = ?', id)
    await this.sendWeekEvent(scheduledEvent)
    await this.query(qb)
    if (_get(scheduledEvent, 'event.worksheetId')) {
      const worksheetRepo = new WorksheetRepository()
      const worksheet = await worksheetRepo.findByIdOrThrow(_get(scheduledEvent, 'event.worksheetId'))
      const updatedWorksheet = t.update(worksheet, { lastAddedMeeting: { $set: null } })
      await worksheetRepo.save(updatedWorksheet, false)
    }
  }

  async list (query = {}) {
    const params = t.ScheduledEventListQuery(query)
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset)
    const qbCount = this.getQueryBuilder('count')

    if (params.createdBy) {
      qb.where('createdBy = ?', params.createdBy)
      qbCount.where('createdBy = ?', params.createdBy)
    }

    if (params.type) {
      qb.where('type = ?', params.type)
      qbCount.where('type = ?', params.type)
    }

    if (params.createdAt) {
      addDateQueryToBuilder(qb, 'createdAt', params.createdAt)
      addDateQueryToBuilder(qbCount, 'createdAt', params.createdAt)
    } else if (params.notifyAt) {
      addMinuteDateQueryToBuilder(qb, 'notifyAt', params.notifyAt)
      addMinuteDateQueryToBuilder(qbCount, 'notifyAt', params.notifyAt)
    } else if (params.eventDate) {
      addDateQueryToBuilder(qb, 'eventDate', params.eventDate)
      addDateQueryToBuilder(qbCount, 'eventDate', params.eventDate)
    } else if (params.eventDateBetween) {
      addBetweenQueryToBuilder(qb, 'eventDate', params.eventDateBetween)
      addBetweenQueryToBuilder(qbCount, 'eventDate', params.eventDateBetween)
    } else if (params.notifyBetween) {
      addBetweenQueryToBuilder(qb, 'notifyAt', params.notifyBetween)
      addBetweenQueryToBuilder(qbCount, 'notifyAt', params.notifyBetween)
    } else if (params.createdBetween) {
      addBetweenQueryToBuilder(qb, 'createdAt', params.createdBetween)
      addBetweenQueryToBuilder(qbCount, 'createdAt', params.createdBetween)
    }
    const total = await this.countQuery(qbCount)
    const results = await this.query(qb)

    return fromJSON({ total, results }, t.ScheduleEventsListResponse)
  }

  async weekScheduleEventMeetings (week, year, location) {
    const now = utc()
    const y = year || now.year()
    const w = week || now.week()
    const rangeWeek = buildRangeFromWeek(w, y)

    const qb = this.getQueryBuilder()
    addBetweenQueryToBuilder(qb, 'eventDate', rangeWeek)
    qb.where('type = ?', 'MEETINGS')

    const results = await this.query(qb)
    if (location) {
      return results.map(buildDistanceCalculator(location, 'event.eventLocation'))
    } else {
      return results
    }
  }

  async sendWeekEvent (scheduleEvent) {
    const week = meetingWeekFormat(scheduleEvent.eventDate)
    return this.sendEvent(week, scheduleEvent)
  }

  async preSave (scheduleEvent) {
    await this.validateMeeting(scheduleEvent)
    const ownerId = _get(scheduleEvent, 'event.ownerId')
    if (ownerId) {
      const ownerRepo = new OwnerRepository()
      const [owner] = await ownerRepo.findByIdWithIncludes(ownerId, ['person', 'building'])
      if (owner) {
        const updatedEvent = t.update(scheduleEvent.event, { $merge: { owner } })
        return t.update(scheduleEvent, { event: { $set: updatedEvent } })
      }
    }
    return scheduleEvent
  }

  async postSave (scheduleEvent) {
    return this.sendWeekEvent(scheduleEvent)
  }
}

function areAllowedMeetingMinutes (time, allowedMinutes = [0, 30]) {
  const min = time.getMinutes()

  return allowedMinutes.indexOf(min) !== -1
}
