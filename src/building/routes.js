import { Router } from 'express'
import {
  addMetadataToBuildingController,
  addOwnerToBuildingController,
  createAllAgentsStockStatsController,
  createListBuildingProposalsController,
  createListBuildingsController,
  createListVerifiedOwnersController,
  createMetadataUploadUrlController,
  createSetBuildingSalePriceController,
  createSignDocumentsUrlController,
  updateNegotiationProposalController
} from './controllers'
import { wrap } from 'express-promise-wrap'

export const createBuildingsRoutes = awilixContainer => {
  const router = Router()

  router.post('/create-url', createMetadataUploadUrlController)

  router.post('/:id/metadata', addMetadataToBuildingController)

  router.post('/:buildingId/documents-signed-urls',
    createSignDocumentsUrlController(awilixContainer.resolve('getDocumentsSignedURLService')))

  router.post('/:id/negotiation', wrap(awilixContainer.resolve('addNegotiationProposalController')))

  router.get('/:buildingId/proposals', createListBuildingProposalsController(awilixContainer.resolve('listBuildingProposalsService')))

  router.put('/:building_id/negotiation/:id', updateNegotiationProposalController)

  router.post('/:id/owners', addOwnerToBuildingController)
  router.post('/:buildingId/set-featured-owner', awilixContainer.resolve('setFeaturedOwnerController'))

  router.get('/:buildingId/owners', wrap(awilixContainer.resolve('listBuildingOwnersController')))

  router.get('/:buildingId/verified-owners', createListVerifiedOwnersController(awilixContainer.resolve('legacyOwnersRepository')))

  router.get('/', createListBuildingsController(awilixContainer.resolve('listBuildingsService')))

  router.put(
    '/:buildingId/negotiation-status',
    awilixContainer.resolve('updateBuildingNegotiationStatusController')
  )

  router.put(
    '/:buildingId/sale-price',
    createSetBuildingSalePriceController(awilixContainer.resolve('setBuildingSalePriceService'))
  )

  router.get('/stock-stats', createAllAgentsStockStatsController(awilixContainer.resolve('adminBuildingRepository')))

  return router
}
