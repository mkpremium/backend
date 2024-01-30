import _get from 'lodash/get'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { CouchbaseModel } from '../../db/model'
import { newHttpError } from '../../lib/http-error'
import { LegacyWorksheetRepository } from '../../worksheet/models/worksheet-repository'
import { WorkSheetStatus } from '../../worksheet/domain/worksheet'
import { CallScheduledProps, ScheduledEvent, ScheduledEventProps } from '../types'
import { ScheduledEventsRepository } from './schedule-events.repository'
import { ScheduleCallCommand } from '../service/schedule-call.service'

export class CouchbaseScheduledEventsRepository extends CouchbaseModel
  implements ScheduledEventsRepository {
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
      const updatedWorksheet = t.update(worksheet, {
        lastAddedMeeting: { $set: scheduledEvent },
        status: { $set: WorkSheetStatus.MEETING }
      })
      await worksheetRepo.save(updatedWorksheet)
    }

    return scheduledEvent
  }

  async addScheduleCallEvent (data: ScheduleCallCommand["event"], createdBy: string): Promise<CallScheduledProps> {
    const params = Object.assign({}, data, { createdBy, type: 'CALLS' })
    return this.save(params)
  }

  async update (id: string, data: Pick<ScheduledEventProps, 'eventDate'>) {
    const scheduledEvent = await this.findByIdOrThrow(id)
    const updatedScheduledEventData = t.update(scheduledEvent, {
      $merge: {
        eventDate: data.eventDate,
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
    ).then(rows => rows.length === 1 ? fromJSON(rows[ 0 ], ScheduledEvent) : undefined)
  }
}
