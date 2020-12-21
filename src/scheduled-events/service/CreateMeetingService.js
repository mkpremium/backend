import { newHttpError } from '../../lib/http-error'
import { isBusiness } from '../../lib/role-operators'

export class CreateMeetingService {
  /**
   * @param {ScheduledEventsRepository} scheduledEventsRepository
   * @param {BuildingsRepository} buildingRepository
   * @param {EventBus} eventBus
   */
  constructor (scheduledEventsRepository, buildingRepository, eventBus) {
    this.buildingRepository = buildingRepository
    this.scheduledEventsRepository = scheduledEventsRepository
    this.eventBus = eventBus
  }

  async createMeeting (operator, requestBody) {
    const meetingAgentId = requestBody.notifyTo
    this.checkOperatorPermissions(operator, meetingAgentId)

    const createdMeeting = await this.scheduledEventsRepository.addScheduledMeetingEvent(requestBody, operator.id)
    await this.buildingRepository.assignBuildingToAgent(createdMeeting.event.buildingId, meetingAgentId)
    await this.eventBus.publish({
      name: 'meeting.created',
      userId: createdMeeting.notifyTo,
      buildingId: createdMeeting.event.buildingId
    })

    return createdMeeting
  }

  checkOperatorPermissions (operator, meetingOperatorId) {
    if (isBusiness(operator.roles) && operator.id !== meetingOperatorId) {
      throw newHttpError(403, 'No tiene los permisos suficientes para esta operación')
    }
  }
}
