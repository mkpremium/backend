import { ScheduledCallsRepository } from '../repository/scheduled-calls.repository'
import { MeetingCreated } from '../service/create-meeting.service'
import { OfferRequestCreated } from '../../building/service/add-offer-request.service'

interface Deps {
  scheduledCallsRepository: ScheduledCallsRepository
}

export function removeCallsOnNewMeetingOrOfferRequest ({ scheduledCallsRepository }: Deps) {
  return function ({ buildingId }: MeetingCreated | OfferRequestCreated) {
    return scheduledCallsRepository.removeScheduledCallsForBuilding(buildingId)
  }
}
