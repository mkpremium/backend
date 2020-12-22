export class DeleteMeetingService {
  constructor (meetingRepository, eventBus) {
    this.meetingRepository = meetingRepository
    this.eventBus = eventBus
  }

  async deleteMeeting (meetingId, user) {
    const meeting = await this.meetingRepository.get(meetingId)
    await this.meetingRepository.delete(meetingId)
    this.eventBus.publish({
      meetingId,
      name: 'meeting.deleted',
      meetingAt: meeting.meetingAt.toISOString(),
      byUserOfId: user.id,
      buildingId: meeting.buildingId
    })
  }
}
