import { MeetingCreated } from '../service/create-meeting.service'
import { OfferRequestCreated } from '../../building/service/add-offer-request.service'
import type { RemoveScheduledCallsService } from '../service/remove-scheduled-calls.service'

interface Deps {
  removeScheduledCallsService: RemoveScheduledCallsService
}

export function removeCallsOnNewMeetingOrOfferRequest ({ removeScheduledCallsService }: Deps) {
  return async function ({ buildingId }: MeetingCreated | OfferRequestCreated) {
    await removeScheduledCallsService.removeScheduledCallsFor(buildingId)
  }
}
