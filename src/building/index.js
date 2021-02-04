import './types'
import { createBuildingRoutes } from './routes'
import jwt, { permissions } from '../middleware/jwt'
import { BuildingNotesRepository } from './repository/building-notes.repository'
import { TNote } from '../notes/types'
import { aliasTo, asClass, asFunction } from 'awilix'
import { createListBuildingOwnersController } from './controller/list-building-owners.controller'
import { LegacyBuildingRepository } from './models'
import { BuildingsRepository } from './repository/buildings.repository'
import { SetBuildingSalePriceService } from './service/set-building-sale-price.service'
import { createSetFeaturedOwnerController } from './controller/set-featured-owner.controller'
import { FeaturedOwnerService } from './service/featured-owner.service'
import { AddProposalService } from './service/add-proposal.service'
import { createUpdateBuildingNegotiationStatusController } from './controller/update-building-negotiation-status.controller'
import { UpdateBuildingNegotiationStatusService } from './service/update-building-negotiation-status.service'
import { createAddNegotiationProposalController } from './controllers'
import { createScheduledCallListener } from './event-listener/call-scheduled.listener'
import { createSetBuildingExpensesController } from './controller/set-building-expenses.controller'
import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { SetBuildingExpensesService } from './service/set-building-expenses.service'

/**
 * @param {AwilixContainer} awilixContainer
 */
export const registerBuildingDependencies = awilixContainer => {
  awilixContainer.register({
    setBuildingSalePriceService: asClass(SetBuildingSalePriceService).singleton(),
    featuredOwnerService: asClass(FeaturedOwnerService).singleton().classic(),
    addProposalService: asClass(AddProposalService).singleton(),
    updateBuildingNegotiationStatusService: asClass(UpdateBuildingNegotiationStatusService).singleton().classic(),
    setBuildingExpensesService: asClass(SetBuildingExpensesService).singleton(),

    buildingsRepository: asClass(BuildingsRepository).singleton().classic(),
    buildingRepository: aliasTo('buildingsRepository'),
    legacyBuildingsRepository: asClass(LegacyBuildingRepository).singleton(),

    listBuildingOwnersController: asFunction(createListBuildingOwnersController).singleton(),
    setFeaturedOwnerController: asFunction(createSetFeaturedOwnerController).singleton(),
    updateBuildingNegotiationStatusController: asFunction(createUpdateBuildingNegotiationStatusController).singleton(),
    addNegotiationProposalController: asFunction(createAddNegotiationProposalController).singleton(),
    setBuildingExpensesController: asFunction(createSetBuildingExpensesController).singleton(),

    scheduledCallListener: asFunction(createScheduledCallListener).singleton()
  })
}

export const oldInit = (app, awilixContainer, {
  listBuildingsService,
  listBuildingProposalsService,
  adminBuildingRepository,
  getDocumentsSignedURLService,
  eventBus,
  couchbaseAdapter
}) => {
  const buildingNotesRepository = new BuildingNotesRepository(couchbaseAdapter)
  eventBus.on('worksheet.made_available', async ({ buildingId }) => {
    const note = TNote({
      note: 'Ficha devuelta al callcenter',
      createdBy: 'SYSTEM',
      context: { buildingId }
    })
    await buildingNotesRepository.save(note)
  })
  eventBus.on('scheduled_events.call_scheduled', awilixContainer.resolve('scheduledCallListener'))

  const secured = jwt()
  const buildingsRoutes = createBuildingRoutes(
    listBuildingsService,
    listBuildingProposalsService,
    awilixContainer.resolve('legacyOwnersRepository'),
    awilixContainer.resolve('legacyBuildingsRepository'),
    adminBuildingRepository,
    awilixContainer.resolve('setBuildingSalePriceService'),
    getDocumentsSignedURLService,
    awilixContainer.resolve('listBuildingOwnersController'),
    awilixContainer
  )
  app.use('/buildings', secured, buildingsRoutes)

  const buildingRoutes = new Router()
  buildingRoutes.put(
    '/:buildingId/expenses',
    permissions.admin,
    wrap(awilixContainer.resolve('setBuildingExpensesController'))
  )
  app.use('/building', secured, buildingRoutes)
}
