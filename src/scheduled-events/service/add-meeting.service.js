import t from 'tcomb'
import { validate } from 'tcomb-validation'
import { ScheduledEvent } from '../types'
import { InvalidCommand } from '../../infrastructure/invalid-command.error'

const AddMeetingRequest = ScheduledEvent.extend({
  reporterContactId: t.String
})

export class AddMeetingService {
  constructor (meetingsRepository) {
    this.meetingsRepository = meetingsRepository
  }

  async createMeeting (command) {
    this.assertValidCommand(command)

    this.meetingsRepository.add({
      buildingId: command.buildingId,
      withAgentOfId: command.notifyTo,
      meetingAt: command.eventDate
    })
  }

  assertValidCommand (command) {
    const validation = validate(command, AddMeetingRequest)
    if (!validation.isValid()) {
      throw new InvalidCommand(validation.errors)
    }
  }
}
