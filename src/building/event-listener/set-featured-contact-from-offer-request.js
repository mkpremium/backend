export const createSetFeaturedContactFromOfferRequestListener = ({ setOwnerFeaturedContactService }) =>
  ({
    request: {
      ownerId,
      destinationContactId
    }
  }) => setOwnerFeaturedContactService.setFeaturedContact(ownerId, destinationContactId)
