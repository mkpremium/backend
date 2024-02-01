import { LastBuildingOffer } from './list-buildings.service'
import { LastBuildingMeeting } from '../../scheduled-events/repository/postgres-schedule-events.repository'
import { FoundOwnerProps } from '../../owner/repository/owner.repository'
import { utc } from '../../lib/date'

export function inferBuildingLastEvent (
  lastOfferRequest?: LastBuildingOffer,
  lastMeeting?: LastBuildingMeeting
): FoundOwnerProps['lastEvent'] | undefined {
  if (!lastMeeting) {
    return lastOfferRequest ? lastOfferAsLastEvent(lastOfferRequest) : undefined
  }
  if (!lastOfferRequest) {
    return lastMeetingAsLastEvent(lastMeeting)
  }

  const meetingUtc = utc(lastMeeting.meeting_scheduledFor)
  const offerRequestUTC = utc(lastOfferRequest.offer_createdAt)
  if (meetingUtc.isAfter(offerRequestUTC)) {
    return lastMeetingAsLastEvent(lastMeeting)
  } else {
    return lastOfferAsLastEvent(lastOfferRequest)
  }
}

function lastOfferAsLastEvent (lastOfferRequest: LastBuildingOffer) {
  return {
    eventDate: lastOfferRequest.offer_createdAt.toISOString(),
    ownerId: lastOfferRequest.ownerId,
    flipperName: '',
    type: 'offer-request'
  } as FoundOwnerProps['lastEvent']
}

function lastMeetingAsLastEvent (lastMeeting: LastBuildingMeeting) {
  return {
    eventDate: lastMeeting.meeting_scheduledFor.toISOString(),
    flipperName: '',
    ownerId: lastMeeting.ownerId,
    type: 'meeting'
  } as FoundOwnerProps['lastEvent']
}
