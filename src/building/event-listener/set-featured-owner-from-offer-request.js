export const createSetFeaturedOwnerFromOfferRequestListener = ({
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
