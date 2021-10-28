import { MeetingCreated } from '../../scheduled-events/service/create-meeting.service'
import { LeadCaptured } from '../service/lead-recorder.service'


/**
 * @param {FeaturedOwnerService} featuredOwnerService
 * @param {SetOwnerFeaturedContactService} setOwnerFeaturedContactService
 */
export function setFeaturedOwnerAndContactFromMeetingListener (
  {
    featuredOwnerService,
    setOwnerFeaturedContactService
  }
) {
  return function ({
                     buildingId,
                     ownerId,
                     contactId
                   }: MeetingCreated | LeadCaptured
  ) {
    return Promise.all([
      featuredOwnerService.setBuildingFeaturedOwner(buildingId, ownerId),
      setOwnerFeaturedContactService.setFeaturedContact(ownerId, contactId)
    ])
  }
}
