import './types'
import { createBuildingRoutes } from './routes'
import jwt from '../middleware/jwt'
import { BuildingNotesRepository } from './repository/building-notes.repository'
import { TNote } from '../notes/types'
import { asClass, asFunction } from 'awilix'
import { createListBuildingOwnersController } from './controller/list-building-owners.controller'
import { OwnerRepository as LegacyOwnerRepository } from '../owner/models'
import { BuildingRepository as LegacyBuildingRepository } from './models'

/**
 * @param {AwilixContainer} awilixContainer
 */
export const setupDependencies = awilixContainer => {
  awilixContainer.register({
    legacyOwnersRepository: asClass(LegacyOwnerRepository),
    legacyBuildingsRepository: asClass(LegacyBuildingRepository),
    listBuildingOwnersController: asFunction(createListBuildingOwnersController)
  })
}

export const oldInit = (app, awilixContainer, {
  listBuildingsService,
  listBuildingProposalsService,
  updateBuildingNegotiationStatusService,
  adminBuildingRepository,
  setBuildingSalePriceService,
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
    setBuildingSalePriceService,
    getDocumentsSignedURLService,
    awilixContainer.resolve('listBuildingOwnersController')
  ))
}
