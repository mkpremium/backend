export const createSetFeaturedContactFromOfferRequestListener = ({ setOwnerFeaturedContactService }) =>
  ({
    request: {
      ownerId,
      reporterContactId
    }
  }) => setOwnerFeaturedContactService.setFeaturedContact(ownerId, reporterContactId)
