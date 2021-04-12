import t from 'tcomb'
import { validate } from 'tcomb-validation'
import { ScheduledEvent } from '../types'
import { InvalidCommand } from '../../infrastructure/invalid-command.error'

const AddMeetingRequest = ScheduledEvent.extend({
  reporterContactId: t.String
})

export class AddMeetingService {
  constructor (meetingsRepository, buildingsRepository) {
    this.meetingsRepository = meetingsRepository
    this.buildingsRepository = buildingsRepository
  }

  async createMeeting (command) {
    this.assertValidCommand(command)

    await this.meetingsRepository.add({
      buildingId: command.buildingId,
      withAgentOfId: command.notifyTo,
      meetingAt: command.eventDate
    })

    await this.buildingsRepository.assignBuildingToAgent(command.notifyTo)
  }

  assertValidCommand (command) {
    const validation = validate(command, AddMeetingRequest)
    if (!validation.isValid()) {
      throw new InvalidCommand(validation.errors)
    }
  }
}
