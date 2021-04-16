export const createAddOfferRequestController = ({ addOfferRequestService }) => async (req, res) => {
  const offerRequest = {
    ...req.body,
    buildingId: req.params.buildingId,
    callerId: req.user.id
  }
  return addOfferRequestService.addOfferRequest(offerRequest)
    .then(() => {
      res.status(201).json({})
    })
}
