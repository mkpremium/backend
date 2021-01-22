import './types'
import { createBuildingRoutes } from './routes'
import jwt from '../middleware/jwt'
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

/**
 * @param {AwilixContainer} awilixContainer
 */
export const setupDependencies = awilixContainer => {
  awilixContainer.register({
    setBuildingSalePriceService: asClass(SetBuildingSalePriceService).singleton(),
    featuredOwnerService: asClass(FeaturedOwnerService).singleton().classic(),
    addProposalService: asClass(AddProposalService).singleton(),

    buildingsRepository: asClass(BuildingsRepository).singleton().classic(),
    buildingRepository: aliasTo('buildingsRepository'),
    legacyBuildingsRepository: asClass(LegacyBuildingRepository).singleton(),

    listBuildingOwnersController: asFunction(createListBuildingOwnersController).singleton(),
    setFeaturedOwnerController: asFunction(createSetFeaturedOwnerController).singleton()
  })
}

export const oldInit = (app, awilixContainer, {
  listBuildingsService,
  listBuildingProposalsService,
  updateBuildingNegotiationStatusService,
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

  const secured = jwt()
  app.use('/buildings', secured, createBuildingRoutes(
    listBuildingsService,
    listBuildingProposalsService,
    awilixContainer.resolve('legacyOwnersRepository'),
    updateBuildingNegotiationStatusService,
    awilixContainer.resolve('legacyBuildingsRepository'),
    adminBuildingRepository,
    awilixContainer.resolve('setBuildingSalePriceService'),
    getDocumentsSignedURLService,
    awilixContainer.resolve('listBuildingOwnersController'),
    awilixContainer
  ))
}
