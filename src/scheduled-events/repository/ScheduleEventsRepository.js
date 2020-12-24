import _get from 'lodash/get'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { CouchbaseModel } from '../../db/model'
import { logger } from '../../infrastructure/logger'
import { buildRangeFromWeek, utc } from '../../lib/date'
import { newHttpError } from '../../lib/http-error'
import {
  addBetweenQueryToBuilder,
  addDateQueryToBuilder,
  addMinuteBetweenQueryToBuilder,
  addMinuteDateQueryToBuilder
} from '../../lib/query/helpers'
import { OwnerRepository } from '../../owner/models'
import { OperatorStats } from '../../stats/models'
import { OperatorActions } from '../../stats/types'
import { SystemPreferencesRepository } from '../../system-preferences/models'
import { ListQuery } from '../../types/params'
import { StringSplitList } from '../../types/refinement'
import { LegacyWorksheetRepository } from '../../worksheet/models/worksheet-repository'
import { WorkSheetStatus } from '../../worksheet/domain/worksheet'
import { ScheduledEvent, ScheduledEventType, Event, ScheduledEventTypeEnum } from '../types'

const ScheduleEventsListResponse = t.struct(
  {
    total: t.Number,
    results: t.list(ScheduledEvent)
  },
  {
    name: 'ScheduleEventsListResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
)

const UpdateScheduledEvent = t.struct({
  notifyAt: t.maybe(t.Date),
  eventDate: t.maybe(t.Date),
  event: t.maybe(Event)
}, 'UpdateScheduledEvent')

const ScheduledEventListQuery = ListQuery.extend(
  {
    createdBy: t.maybe(t.String),
    notifyAt: t.maybe(t.String),
    type: t.maybe(ScheduledEventTypeEnum),
    createdAt: t.maybe(t.String),
    eventDate: t.maybe(t.String),
    eventDateBetween: t.maybe(t.String),
    createdBetween: t.maybe(StringSplitList),
    notifyBetween: t.maybe(StringSplitList)
  },
  {
    name: 'ScheduledEventListQuery',
    defaultProps: {
      createdBetween: ',',
      notifyBetween: ',',
      eventDateBetween: ','
    }
  }
)

export class ScheduledEventsRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = ScheduledEvent
  }

  async findByIdOrThrow (id) {
    const scheduledEvent = await this.findById(id)
    if (!scheduledEvent) {
      throw newHttpError(404, `Evento programado ${id} no existe`)
    }

    return scheduledEvent
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

    if (!areMeetingMinutesAllowed(data.eventDate, pref.meetingRestrictions.allowedStartMinutes)) {
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
    const eventDate = [ start, end ].join(',')
    addMinuteBetweenQueryToBuilder(qb, 'eventDate', eventDate)
    qb.where('type = ?', ScheduledEventType.MEETINGS)
    qb.where('notifyTo = ?', notifyTo)
    if (scheduleId) {
      qb.where('id != ?', scheduleId)
    }
    return this.query(qb)
  }

  /**
   * @param {ScheduledEvent} data
   * @param {string} createdBy
   */
  async addScheduledMeetingEvent (data = {}, createdBy) {
    const params = { ...data, createdBy, type: 'MEETINGS' }
    const scheduledEvent = await this.save(params)

    if (_get(scheduledEvent, 'event.worksheetId')) {
      const worksheetRepo = new LegacyWorksheetRepository()
      const worksheet = await worksheetRepo.findByIdWIthIncludes(_get(scheduledEvent, 'event.worksheetId'))
      const { city, province } = _get(worksheet, 'relatedBuildings.0.address', {})
      const updatedWorksheet = t.update(worksheet, {
        lastAddedMeeting: { $set: scheduledEvent },
        status: { $set: WorkSheetStatus.MEETING }
      })
      await worksheetRepo.save(updatedWorksheet, false)
      if (worksheet.lastAddedMeeting === null) {
        const action = _get(scheduledEvent, 'event.inPerson') ? OperatorActions.MEETING : OperatorActions.NON_PRESENTIAL_MEETING
        await OperatorStats.registerAction(createdBy, action, { city, province })
        await OperatorStats.registerAction(data.notifyTo, OperatorActions.BUSINESS_MEETING, { city, province })
      }
    }

    return scheduledEvent
  }

  async addScheduleCallEvent (data = {}, createdBy) {
    const params = Object.assign({}, data, { createdBy, type: 'CALLS' })
    return this.save(params)
  }

  async update (id, data = {}) {
    logger.debug('scheduled-events-model#update', { id, data })
    const scheduledEvent = await this.findByIdOrThrow(id)
    fromJSON(data, UpdateScheduledEvent)
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

    return this.save(updatedScheduledEventData)
  }

  async delete (id) {
    const qb = this.getQueryBuilder('delete').where('id = ?', id)
    await this.query(qb)
  }

  async list (query = {}) {
    const params = ScheduledEventListQuery(query)
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

    return fromJSON({ total, results }, ScheduleEventsListResponse)
  }

  async weekScheduleEventMeetings (week, year) {
    const now = utc()
    const y = year || now.year()
    const w = week || now.week()
    const rangeWeek = buildRangeFromWeek(w, y)

    const qb = this.getQueryBuilder()
    addBetweenQueryToBuilder(qb, 'eventDate', rangeWeek)
    qb.where('type = ?', 'MEETINGS')

    return this.query(qb)
  }

  async preSave (scheduleEvent) {
    await this.validateMeeting(scheduleEvent)
    const ownerId = _get(scheduleEvent, 'event.ownerId')
    if (ownerId) {
      const ownerRepo = new OwnerRepository()
      const [ owner ] = await ownerRepo.findByIdWithIncludes(ownerId, [ 'building' ])
      if (owner) {
        const updatedEvent = t.update(scheduleEvent.event, { $merge: { owner } })
        return t.update(scheduleEvent, { event: { $set: updatedEvent } })
      }
    }
    return scheduleEvent
  }
}

function areMeetingMinutesAllowed (time, allowedMinutes = [ 0, 30 ]) {
  const min = time.getMinutes()

  return allowedMinutes.indexOf(min) !== -1
}
