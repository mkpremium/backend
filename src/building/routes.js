import { Router } from 'express'
import {
  addMetadataToBuildingController,
  addOwnerToBuildingController,
  createAddNegotiationProposalController,
  createAllAgentsStockStatsController,
  createListBuildingProposalsController,
  createListBuildingsController,
  createListVerifiedOwnersController,
  createMetadataUploadUrlController,
  createSetBuildingSalePriceController,
  createSignDocumentsUrlController,
  createUpdateBuildingNegotiationStatusController,
  updateNegotiationProposalController
} from './controllers'
import { wrap } from 'express-promise-wrap'

export const createBuildingRoutes = (
  listBuildingsService,
  listBuildingProposalsService,
  legacyOwnerRepository,
  updateBuildingNegotiationStatusService,
  legacyBuildingRepository,
  adminBuildingRepository,
  setBuildingSalePriceService,
  getDocumentsSignedURLService,
  listBuildingOwnersController,
  awilixContainer
) => {
  const router = Router()

  router.post('/create-url', createMetadataUploadUrlController)

  router.post('/:id/metadata', addMetadataToBuildingController)

  router.post('/:buildingId/documents-signed-urls', createSignDocumentsUrlController(getDocumentsSignedURLService))

  router.post('/:id/negotiation', createAddNegotiationProposalController(legacyBuildingRepository, updateBuildingNegotiationStatusService))

  router.get('/:buildingId/proposals', createListBuildingProposalsController(listBuildingProposalsService))

  router.put('/:building_id/negotiation/:id', updateNegotiationProposalController)

  router.post('/:id/owners', addOwnerToBuildingController)
  router.post('/:buildingId/set-featured-owner', awilixContainer.resolve('setFeaturedOwnerController'))

  router.get('/:buildingId/owners', wrap(listBuildingOwnersController))

  router.get('/:buildingId/verified-owners', createListVerifiedOwnersController(legacyOwnerRepository))

  router.get('/', createListBuildingsController(listBuildingsService))

  router.put(
    '/:buildingId/negotiation-status',
    createUpdateBuildingNegotiationStatusController(updateBuildingNegotiationStatusService)
  )

  router.put(
    '/:buildingId/sale-price',
    createSetBuildingSalePriceController(setBuildingSalePriceService)
  )

  router.get('/stock-stats', createAllAgentsStockStatsController(adminBuildingRepository))

  return router
}
