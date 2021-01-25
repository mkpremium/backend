import { wrap } from 'express-promise-wrap'

/**
 * @param {UpdateBuildingNegotiationStatusService} updateBuildingNegotiationStatusService
 */
export function createUpdateBuildingNegotiationStatusController ({ updateBuildingNegotiationStatusService }) {
  return wrap(async (req, res) => {
    const { status, sourceOwnerId } = req.body
    await updateBuildingNegotiationStatusService.updateBuildingStatus(
      req.params.buildingId, { status, sourceOwnerId, userId: req.user.id })
    res.sendStatus(200)
  })
}
