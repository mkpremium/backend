export const createAddEvaluationRequestController = ({ addEvaluationRequestService }) => async (req, res) => {
  const evaluationRequest = {
    ...req.body,
    buildingId: req.params.buildingId,
    callerId: req.user.id
  }
  return addEvaluationRequestService.addOfferRequest(evaluationRequest)
    .then(() => {
      res.status(201).json({})
    })
}
