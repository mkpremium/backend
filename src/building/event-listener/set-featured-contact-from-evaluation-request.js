export const createSetFeaturedContactFromEvaluationRequestListener = ({ setOwnerFeaturedContactService }) =>
  ({
    request: {
      ownerId,
      destinationContactId
    }
  }) => setOwnerFeaturedContactService.setFeaturedContact(ownerId, destinationContactId)
