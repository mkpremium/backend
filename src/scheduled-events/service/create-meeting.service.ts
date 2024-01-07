import { newHttpError } from '../../lib/http-error'
import { isBusiness } from '../../lib/role-operators'
import { EventPublisher } from '../../infrastructure/event-bus'
import { BuildingsRepository } from '../../building/repository/buildings.repository'
import { CouchbaseScheduledEventsRepository } from '../repository/couchbase-schedule-events.repository'
import { DataSource } from 'typeorm'

export interface MeetingCreated {
  name: 'meeting.created'
  meetingId: string
  userId: string
  ownerId: string
  contactId: string
  buildingId: string
  note: string
}

export class CreateMeetingService {
  constructor (
    private couchbaseScheduledEventsRepository: CouchbaseScheduledEventsRepository,
    private buildingsRepository: BuildingsRepository,
    private eventBus: EventPublisher,
    private usePostgres: boolean,
    private ormDataSource: DataSource,
  ) {
  }

  async createMeeting (operator, requestBody) {
    const meetingAgentId = requestBody.notifyTo
    this.checkOperatorPermissions(operator, meetingAgentId)

    const createdMeeting = await (this.usePostgres ? postgresCreateMeeting(requestBody, operator, meetingAgentId, this.ormDataSource) : couchbaseCreateMeeting(requestBody, operator, meetingAgentId, {
      couchbaseScheduledEventsRepository: this.couchbaseScheduledEventsRepository,
      buildingsRepository: this.buildingsRepository
    }))

    await this.eventBus.publish({
      name: 'meeting.created',
      meetingId: createdMeeting.id,
      userId: createdMeeting.notifyTo,
      ownerId: createdMeeting.event.ownerId,
      contactId: createdMeeting.event.contactId,
      buildingId: createdMeeting.event.buildingId,
      note: requestBody.note
    } as MeetingCreated)

    return createdMeeting
  }

  checkOperatorPermissions (operator, meetingOperatorId) {
    if (isBusiness(operator.roles) && operator.id !== meetingOperatorId) {
      throw newHttpError(403, 'No tiene los permisos suficientes para esta operación')
    }
  }
}


async function postgresCreateMeeting(requestBody, operator, meetingAgentId, ormDataSource: DataSource) {

}

interface CouchbaseDeps {
  couchbaseScheduledEventsRepository: CouchbaseScheduledEventsRepository,
  buildingsRepository: BuildingsRepository
}

async function couchbaseCreateMeeting (requestBody, operator, meetingAgentId, {
  couchbaseScheduledEventsRepository,
  buildingsRepository
}: CouchbaseDeps) {
  const createdMeeting = await couchbaseScheduledEventsRepository.addScheduledMeetingEvent(requestBody, operator.id)
  await buildingsRepository.assignBuildingToAgent(createdMeeting.event.buildingId, meetingAgentId)

  return createdMeeting
}
