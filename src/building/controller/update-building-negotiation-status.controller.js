import { wrap } from 'express-promise-wrap'

/**
 * @param {UpdateBuildingNegotiationStatusService} updateBuildingNegotiationStatusService
 */
export function createUpdateBuildingNegotiationStatusController ({ updateBuildingNegotiationStatusService }) {
  return wrap(async (req, res) => {
    await updateBuildingNegotiationStatusService.updateBuildingStatus(
      req.params.buildingId, req.body.status, req.user.id)
    res.json()
  })
}
