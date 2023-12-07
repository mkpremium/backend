import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import {
  createAllAgentsStockStatsController,
  createListBuildingProposalsController,
  createListVerifiedOwnersController,
  createMetadataUploadUrlController,
  createSetBuildingSalePriceController,
  createSignDocumentsUrlController
} from './controllers'

export const createBuildingsRoutes = container => {
  const router = Router()

  router.post('/', wrap(container.resolve('createBuildingController')))
  router.post('/create-url', createMetadataUploadUrlController)

  router.post('/:buildingId/documents-signed-urls',
    createSignDocumentsUrlController(container.resolve('getDocumentsSignedURLService')))

  router.post('/:id/negotiation', wrap(container.resolve('addNegotiationProposalController')))

  router.get('/:buildingId/proposals', createListBuildingProposalsController(container.resolve('listBuildingProposalsService')))

  router.put('/:building_id/negotiation/:id', container.resolve('updateNegotiationProposalController'))

  router.post('/:id/owners', wrap(container.resolve('addOwnerToBuildingController')))
  router.post('/:buildingId/set-featured-owner', wrap(container.resolve('setFeaturedOwnerController')))

  router.get('/:buildingId/owners', wrap(container.resolve('listBuildingOwnersController')))

  router.get('/:buildingId/verified-owners', createListVerifiedOwnersController(container.resolve('ownersRepository')))

  router.get('/', wrap(container.resolve('listBuildingsController')))

  router.put(
    '/:buildingId/negotiation-status',
    container.resolve('updateBuildingNegotiationStatusController')
  )

  router.put(
    '/:buildingId/sale-price',
    createSetBuildingSalePriceController(container.resolve('setBuildingSalePriceService'))
  )

  router.get('/stock-stats', createAllAgentsStockStatsController(container.resolve('adminBuildingRepository')))

  return router
}
