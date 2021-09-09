import { newHttpError } from '../../lib/http-error'
import { isBusiness } from '../../lib/role-operators'
import { EventBus } from '../../infrastructure/event-bus'
import { ScheduledEventsRepository } from '../repository/schedule-events.repository'
import { BuildingsRepository } from '../../building/repository/buildings.repository'

export class CreateMeetingService {
  constructor (
    private scheduledEventsRepository: ScheduledEventsRepository,
    private buildingsRepository: BuildingsRepository,
    private eventBus: EventBus,
  ) {
  }

  async createMeeting (operator, requestBody) {
    const meetingAgentId = requestBody.notifyTo
    this.checkOperatorPermissions(operator, meetingAgentId)

    const createdMeeting = await this.scheduledEventsRepository.addScheduledMeetingEvent(requestBody, operator.id)
    await this.buildingsRepository.assignBuildingToAgent(createdMeeting.event.buildingId, meetingAgentId)
    await this.eventBus.publish({
      name: 'meeting.created',
      meetingId: createdMeeting.id,
      userId: createdMeeting.notifyTo,
      ownerId: createdMeeting.event.ownerId,
      contactId: createdMeeting.event.contactId,
      buildingId: createdMeeting.event.buildingId,
      note: requestBody.note
    })

    return createdMeeting
  }

  checkOperatorPermissions (operator, meetingOperatorId) {
    if (isBusiness(operator.roles) && operator.id !== meetingOperatorId) {
      throw newHttpError(403, 'No tiene los permisos suficientes para esta operación')
    }
  }
}
