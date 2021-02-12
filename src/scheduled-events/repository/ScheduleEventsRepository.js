import _get from 'lodash/get'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { CouchbaseModel } from '../../db/model'
import { logger } from '../../infrastructure/logger'
import { buildRangeFromWeek, utc } from '../../lib/date'
import { newHttpError } from '../../lib/http-error'
import { addBetweenQueryToBuilder, addMinuteBetweenQueryToBuilder } from '../../lib/query/helpers'
import { OwnerRepository } from '../../owner/models'
import { OperatorStats } from '../../stats/models'
import { OperatorActions } from '../../stats/types'
import { LegacyWorksheetRepository } from '../../worksheet/models/worksheet-repository'
import { WorkSheetStatus } from '../../worksheet/domain/worksheet'
import { Event, ScheduledEvent, ScheduledEventType } from '../types'

const UpdateScheduledEvent = t.struct({
  notifyAt: t.maybe(t.Date),
  eventDate: t.maybe(t.Date),
  event: t.maybe(Event)
}, 'UpdateScheduledEvent')

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
