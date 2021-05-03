export const createSetFeaturedContactFromOfferRequestListener = ({
  setOwnerFeaturedContactService,
  featuredOwnerService
}) =>
  ({
    buildingId,
    request: {
      ownerId,
      reporterContactId
    }
  }) => setOwnerFeaturedContactService.setFeaturedContact(ownerId, reporterContactId)
    .then(() => featuredOwnerService.setBuildingFeaturedOwner(buildingId, ownerId))
