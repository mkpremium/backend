import { Router } from 'express'
import {
  addMetadataToBuildingController,
  addOwnerToBuildingController,
  createAddNegotiationProposalController,
  createAllAgentsStockStatsController,
  createListBuildingProposalsController,
  createListBuildingsController,
  createListVerifiedOwnersController,
  createMetadataUploadUrlController, createSetBuildingSalePriceController,
  createUpdateBuildingNegotiationStatusController,
  updateNegotiationProposalController
} from './controllers'

export const createBuildingRoutes = (
  listBuildingsService,
  listBuildingProposalsService,
  legacyOwnerRepository,
  updateBuildingNegotiationStatusService,
  legacyBuildingRepository,
  adminBuildingRepository,
  setBuildingSalePriceService
) => {
  const router = Router()

  router.post('/create-url', createMetadataUploadUrlController)

  router.post('/:id/metadata', addMetadataToBuildingController)

  router.post('/:id/negotiation', createAddNegotiationProposalController(legacyBuildingRepository, updateBuildingNegotiationStatusService))

  router.get('/:buildingId/proposals', createListBuildingProposalsController(listBuildingProposalsService))

  router.put('/:building_id/negotiation/:id', updateNegotiationProposalController)

  router.post('/:id/owners', addOwnerToBuildingController)

  router.get('/:buildingId/owners', createListVerifiedOwnersController(legacyOwnerRepository))

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
