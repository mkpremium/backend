import _get from 'lodash/get'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { CouchbaseModel } from '../../db/model'
import { buildRangeFromWeek, utc } from '../../lib/date'
import { newHttpError } from '../../lib/http-error'
import { addBetweenQueryToBuilder } from '../../lib/query/helpers'
import { OperatorStats } from '../../stats/models'
import { OperatorActions } from '../../stats/types'
import { LegacyWorksheetRepository } from '../../worksheet/models/worksheet-repository'
import { WorkSheetStatus } from '../../worksheet/domain/worksheet'
import { CallScheduledProps, Event, ScheduledEvent, ScheduledEventProps } from '../types'

const UpdateScheduledEvent = t.struct<ScheduledEventProps>({
  eventDate: t.maybe(t.Date),
  event: t.maybe(Event),
  createdBy: t.String,
}, 'UpdateScheduledEvent')

export class ScheduledEventsRepository extends CouchbaseModel {
  protected Struct = ScheduledEvent

  async findByIdOrThrow (id) {
    const scheduledEvent = await this.findById(id)
    if (!scheduledEvent) {
      throw newHttpError(404, `Evento programado ${id} no existe`)
    }

    return scheduledEvent
  }

  async addScheduledMeetingEvent (data: Omit<ScheduledEventProps, 'id' | 'type' | 'createdAt' | '_documentType'>, createdBy: string) {
    const params = { ...data, createdBy, type: 'MEETINGS' }
    const scheduledEvent = await this.save(params)

    if (_get(scheduledEvent, 'event.worksheetId')) {
      const worksheetRepo = new LegacyWorksheetRepository()
      const worksheet = await worksheetRepo.findByIdOrThrow(_get(scheduledEvent, 'event.worksheetId'))
      const { city, province } = _get(worksheet, 'relatedBuildings.0.address', {})
      const updatedWorksheet = t.update(worksheet, {
        lastAddedMeeting: { $set: scheduledEvent },
        status: { $set: WorkSheetStatus.MEETING }
      })

      await worksheetRepo.save(updatedWorksheet)
      if (worksheet.lastAddedMeeting === null) {
        const action = _get(scheduledEvent, 'event.inPerson') ? OperatorActions.MEETING : OperatorActions.NON_PRESENTIAL_MEETING
        await OperatorStats.registerAction(createdBy, action, { city, province })
        await OperatorStats.registerAction(data.notifyTo, OperatorActions.BUSINESS_MEETING, { city, province })
      }
    }

    return scheduledEvent
  }

  async addScheduleCallEvent (data: Omit<CallScheduledProps, 'id'>, createdBy: string): Promise<CallScheduledProps> {
    const params = Object.assign({}, data, { createdBy, type: 'CALLS' })
    return this.save(params)
  }

  async update (id: string, data: ScheduledEventProps) {
    const scheduledEvent = await this.findByIdOrThrow(id)
    fromJSON(data, UpdateScheduledEvent)
    const updatedEvent = t.update(scheduledEvent.event, {
      $merge: data.event
    })
    const updatedScheduledEventData = t.update(scheduledEvent, {
      $merge: {
        eventDate: data.eventDate,
        createdBy: data.createdBy,
        event: updatedEvent,
      }
    })

    return this.save(updatedScheduledEventData)
  }

  async delete (id) {
    const qb = this.getQueryBuilder('delete').where('id = ?', id)
    await this.query(qb)
  }

  lastScheduledEventForBuilding (buildingId): Promise<ScheduledEventProps | undefined> {
    return this.couchbaseAdapter.queryAsync(
      `SELECT event.*
       FROM ${this.getBucketName()} event
       WHERE event._documentType = 'scheduled-event'
         AND event.event.buildingId = $1
       ORDER BY event.eventDate DESC
       LIMIT 1
      `, [ buildingId ]
    ).then(rows => rows.length === 1 ? fromJSON(rows[0], ScheduledEvent) : undefined)
  }
}
