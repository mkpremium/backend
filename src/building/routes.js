import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import {
  listBuildingProposalsControllerFactory,
  listVerifiedOwnersControllerFactory,
  setBuildingSalePriceControllerFactory,
  signDocumentsUrlControllerFactory
} from './controllers'

export const createBuildingsRoutes = container => {
  const router = Router()

  router.post('/', wrap(container.resolve('createBuildingController')))

  router.post('/:buildingId/documents-signed-urls',
    signDocumentsUrlControllerFactory(container.resolve('getDocumentsSignedURLService')))

  router.post('/:id/negotiation', wrap(container.resolve('addNegotiationProposalController')))

  router.get('/:buildingId/proposals', listBuildingProposalsControllerFactory(container.resolve('listBuildingProposalsService')))

  router.put('/:building_id/negotiation/:id', container.resolve('updateNegotiationProposalController'))

  router.post('/:id/owners', wrap(container.resolve('addOwnerToBuildingController')))
  router.post('/:buildingId/set-featured-owner', wrap(container.resolve('setFeaturedOwnerController')))

  router.get('/:buildingId/owners', wrap(container.resolve('listBuildingOwnersController')))

  router.get('/:buildingId/verified-owners', listVerifiedOwnersControllerFactory(container.resolve('ownersRepository')))

  router.get('/', wrap(container.resolve('listBuildingsController')))

  router.put(
    '/:buildingId/negotiation-status',
    container.resolve('updateBuildingNegotiationStatusController')
  )

  router.put(
    '/:buildingId/sale-price',
    setBuildingSalePriceControllerFactory(container.resolve('setBuildingSalePriceService'))
  )

  return router
}
