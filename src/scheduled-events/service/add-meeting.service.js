export class AddMeetingService {
  constructor (meetingsRepository) {
    this.meetingsRepository = meetingsRepository
  }

  async createMeeting (command) {
    this.meetingsRepository.add({
      buildingId: command.buildingId,
      withAgentOfId: command.notifyTo,
      meetingAt: command.eventDate
    })
  }
}
