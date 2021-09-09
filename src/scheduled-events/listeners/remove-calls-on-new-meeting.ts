import { ScheduledCallsRepository } from '../repository/scheduled-calls.repository'
import { MeetingCreated } from '../service/create-meeting.service'

interface Deps {
  scheduledCallsRepository: ScheduledCallsRepository
}

export function removeCallsOnNewMeeting ({ scheduledCallsRepository }: Deps) {
  return function ({ buildingId }: MeetingCreated) {
    return scheduledCallsRepository.removeScheduledCallsForBuilding(buildingId)
  }
}
