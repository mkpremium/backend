/**
 * @param {FeaturedOwnerService} featuredOwnerService
 * @param {SetOwnerFeaturedContactService} setOwnerFeaturedContactService
 */
export const createSetFeaturedOwnerAndContactFromMeetingListener = ({
  featuredOwnerService, setOwnerFeaturedContactService
}) => ({
  buildingId,
  ownerId,
  contactId
}) => {
  return Promise.all([
    featuredOwnerService.setBuildingFeaturedOwner(buildingId, ownerId),
    setOwnerFeaturedContactService.setFeaturedContact(ownerId, { phoneId: contactId })
  ])
}
