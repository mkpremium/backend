import { AddOfferRequestService } from "../service/add-offer-request.service";

export const createAddOfferRequestController = ({addOfferRequestService}: {
  addOfferRequestService: AddOfferRequestService
}) => async (req, res) => {
  const offerRequest = {
    ...req.body,
    buildingId: req.params.buildingId,
    callerId: req.user.id
  }
  return addOfferRequestService.addOfferRequest(offerRequest)
    .then(() => {
      res.status(201).json({})
    });
}
