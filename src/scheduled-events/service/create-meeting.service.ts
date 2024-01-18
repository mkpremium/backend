import { newHttpError } from '../../lib/http-error'
import { isBusiness } from '../../lib/role-operators'
import { EventPublisher } from '../../infrastructure/event-bus'
import { BuildingsRepository } from '../../building/repository/buildings.repository'
import { CouchbaseScheduledEventsRepository } from '../repository/couchbase-schedule-events.repository'
import { DataSource } from 'typeorm'
import { UserProps } from '../../types/user'
import { ScheduledEvent } from '../scheduled-event.entity'
import { ScheduledEventId, ScheduledEventProps } from '../types'
import { DomainEventCatalog } from "../../infrastructure/postgres/domain-event.entity";

export interface MeetingCreated {
  name: DomainEventCatalog.SCHEDULED_EVENTS__MEETING_CREATED
  meetingId: string
  userId: string
  ownerId: string
  contactId: string
  buildingId: string
  note?: string
}

interface AddMeetingCommand {
  createdBy: string;
  notifyTo: string;
  event: { eventAddress: string; contactId: string; worksheetId: undefined; ownerId: string; buildingId: string };
  eventDate: Date
  note?: string
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

  async createMeeting (user: Pick<UserProps, 'id' | 'roles'>, cmd: AddMeetingCommand) {
    const meetingAgentId = cmd.notifyTo
    this.checkOperatorPermissions(user, meetingAgentId)

    const createdMeeting = await (this.usePostgres ?
      postgresCreateMeeting(cmd, this.ormDataSource) :
      couchbaseCreateMeeting(cmd, user, meetingAgentId, {
        couchbaseScheduledEventsRepository: this.couchbaseScheduledEventsRepository,
        buildingsRepository: this.buildingsRepository
      }))

    await this.eventBus.publish({
      name: DomainEventCatalog.SCHEDULED_EVENTS__MEETING_CREATED,
      meetingId: createdMeeting.id,
      userId: createdMeeting.notifyTo,
      ownerId: createdMeeting.event.ownerId,
      contactId: createdMeeting.event.contactId,
      buildingId: createdMeeting.event.buildingId,
      note: cmd.note
    } as MeetingCreated)

    return createdMeeting
  }

  checkOperatorPermissions (user: Pick<UserProps, 'id' | 'roles'>, meetingOperatorId) {
    if (isBusiness(user.roles) && user.id !== meetingOperatorId) {
      throw newHttpError(403, 'No tiene los permisos suficientes para esta operación')
    }
  }
}


async function postgresCreateMeeting (cmd: AddMeetingCommand, ormDataSource: DataSource): Promise<ScheduledEventProps> {
  return ormDataSource.transaction<ScheduledEventProps>(async entityManager => {
    const meeting = await entityManager.save(ScheduledEvent, {
      scheduledFor: cmd.eventDate,
      notifyTo: { id: cmd.notifyTo },
      createdBy: { id: cmd.createdBy },
      contact: { id: cmd.event.contactId },
      building: { id: cmd.event.buildingId },
      owner: { id: cmd.event.ownerId },
    })

    return {
      id: meeting.id as ScheduledEventId,
      type: 'MEETINGS',
      eventDate: cmd.eventDate,
      createdBy: cmd.createdBy,
      createdAt: meeting.createdAt,
      notifyTo: cmd.notifyTo,
      event: cmd.event,
    }
  })
}

interface CouchbaseDeps {
  couchbaseScheduledEventsRepository: CouchbaseScheduledEventsRepository,
  buildingsRepository: BuildingsRepository
}

async function couchbaseCreateMeeting (requestBody, operator, meetingAgentId, {
  couchbaseScheduledEventsRepository,
  buildingsRepository
}: CouchbaseDeps): Promise<ScheduledEventProps> {
  const createdMeeting = await couchbaseScheduledEventsRepository.addScheduledMeetingEvent(requestBody, operator.id)
  await buildingsRepository.assignBuildingToAgent(createdMeeting.event.buildingId, meetingAgentId)

  return createdMeeting
}
