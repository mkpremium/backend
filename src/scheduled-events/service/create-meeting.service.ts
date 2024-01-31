import { newHttpError } from '../../lib/http-error'
import { isBusiness } from '../../lib/role-operators'
import { EventPublisher } from '../../infrastructure/event-bus'
import { CouchbaseScheduledEventsRepository } from '../repository/couchbase-schedule-events.repository'
import { EntityManager } from 'typeorm'
import { UserProps } from '../../types/user'
import { ScheduledEvent } from '../scheduled-event.entity'
import { ScheduledEventId, ScheduledEventProps } from '../types'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { CouchbaseBuildingsRepository } from '../../building/repository/couchbase-building.repository'

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
    private couchbaseBuildingsRepository: CouchbaseBuildingsRepository,
    private eventBus: EventPublisher,
    private usePostgres: boolean,
    private entityManager: EntityManager
  ) {
  }

  async createMeeting (user: Pick<UserProps, 'id' | 'roles'>, cmd: AddMeetingCommand) {
    const meetingAgentId = cmd.notifyTo
    this.checkOperatorPermissions(user, meetingAgentId)

    return await (this.usePostgres
      ? this.doPostgres(cmd)
      : this.doCouchbase(cmd, user, meetingAgentId))
  }

  private checkOperatorPermissions (user: Pick<UserProps, 'id' | 'roles'>, meetingOperatorId) {
    if (isBusiness(user.roles) && user.id !== meetingOperatorId) {
      throw newHttpError(403, 'No tiene los permisos suficientes para esta operación')
    }
  }

  private async doPostgres (cmd: AddMeetingCommand): Promise<ScheduledEventProps> {
    return this.entityManager.transaction<ScheduledEventProps>(async entityManager => {
      const meeting = await entityManager.save(ScheduledEvent, {
        type: 'MEETING',
        scheduledFor: cmd.eventDate,
        notifyTo: { id: cmd.notifyTo },
        createdBy: { id: cmd.createdBy },
        contact: { id: cmd.event.contactId },
        building: { id: cmd.event.buildingId },
        owner: { id: cmd.event.ownerId }
      })

      const createdMeeting = {
        id: meeting.id as ScheduledEventId,
        type: 'MEETINGS',
        eventDate: cmd.eventDate,
        createdBy: cmd.createdBy,
        createdAt: meeting.createdAt,
        notifyTo: cmd.notifyTo,
        event: cmd.event
      } as ScheduledEventProps
      await this.publishEvent(createdMeeting, cmd, entityManager)

      return createdMeeting
    })
  }

  private async doCouchbase (requestBody, operator, meetingAgentId): Promise<ScheduledEventProps> {
    const createdMeeting = await this.couchbaseScheduledEventsRepository
      .addScheduledMeetingEvent(requestBody, operator.id)
    await this.couchbaseBuildingsRepository.assignBuildingToAgent(createdMeeting.event.buildingId, meetingAgentId)
    await this.publishEvent(createdMeeting, requestBody)

    return createdMeeting
  }

  private async publishEvent (createdMeeting: ScheduledEventProps, cmd: AddMeetingCommand, entityManager?: EntityManager) {
    await this.eventBus.publish({
      name: DomainEventCatalog.SCHEDULED_EVENTS__MEETING_CREATED,
      meetingId: createdMeeting.id,
      userId: createdMeeting.notifyTo,
      ownerId: createdMeeting.event.ownerId,
      contactId: createdMeeting.event.contactId,
      buildingId: createdMeeting.event.buildingId,
      note: cmd.note
    } as MeetingCreated, entityManager)
  }
}
