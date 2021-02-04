import './types'
import { createBuildingsRoutes } from './routes'
import jwt, { permissions } from '../middleware/jwt'
import { BuildingNotesRepository } from './repository/building-notes.repository'
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
import { CommercialsBuildingRepository } from './repository/commercials-building.repository'
import { ListBuildingsService } from './service/list-buildings.service'
import { ListBuildingProposalsService } from './service/list-building-proposals.service'
import { AdminBuildingRepository } from './repository/admin-building.repository'
import { BuildingDocumentsRepository } from './repository/building-documents.repository'
import aws from 'aws-sdk'
import { metadataS3Config } from '../../config'
import { GetDocumentsSignedURLService } from './service/get-documents-signed-URL.service'
import { createMeetingCreatedListener } from './event-listener/meeting-created.listener'
import { createWorksheetMadeAvailableListener } from './event-listener/worksheet-made-available.listener'

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
    listBuildingsService: asClass(ListBuildingsService).classic().singleton(),
    listBuildingProposalsService: asClass(ListBuildingProposalsService).singleton().classic(),
    getDocumentsSignedURLService: asClass(GetDocumentsSignedURLService).inject(() => ({
      s3Client: new aws.S3({
        signatureVersion: 'v4',
        region: metadataS3Config.region
      }),
      documentBucket: metadataS3Config.bucket
    })).singleton().classic(),

    buildingsRepository: asClass(BuildingsRepository).singleton().classic(),
    buildingRepository: aliasTo('buildingsRepository'),
    legacyBuildingsRepository: asClass(LegacyBuildingRepository).singleton(),
    commercialsBuildingRepository: asClass(CommercialsBuildingRepository).classic().singleton(),
    adminBuildingRepository: asClass(AdminBuildingRepository).classic().singleton(),
    buildingDocumentsRepository: asClass(BuildingDocumentsRepository).classic().singleton(),
    buildingNotesRepository: asClass(BuildingNotesRepository).classic().singleton(),

    listBuildingOwnersController: asFunction(createListBuildingOwnersController).singleton(),
    setFeaturedOwnerController: asFunction(createSetFeaturedOwnerController).singleton(),
    updateBuildingNegotiationStatusController: asFunction(createUpdateBuildingNegotiationStatusController).singleton(),
    addNegotiationProposalController: asFunction(createAddNegotiationProposalController).singleton(),
    setBuildingExpensesController: asFunction(createSetBuildingExpensesController).singleton(),

    scheduledCallListener: asFunction(createScheduledCallListener).singleton(),
    meetingCreatedListener: asFunction(createMeetingCreatedListener).singleton(),
    worksheetMadeAvailableListener: asFunction(createWorksheetMadeAvailableListener).singleton()
  })
}

export const setupBuildingRoutesAndListeners = (app, awilixContainer) => {
  const eventBus = awilixContainer.resolve('eventBus')
  eventBus.on('worksheet.made_available', awilixContainer.resolve('worksheetMadeAvailableListener'))
  eventBus.on('meeting.created', awilixContainer.resolve('meetingCreatedListener'))
  eventBus.on('scheduled_events.call_scheduled', awilixContainer.resolve('scheduledCallListener'))

  const secured = jwt()
  const buildingsRoutes = createBuildingsRoutes(awilixContainer)
  app.use('/buildings', secured, buildingsRoutes)

  const buildingRoutes = new Router()
  buildingRoutes.put(
    '/:buildingId/expenses',
    permissions.admin,
    wrap(awilixContainer.resolve('setBuildingExpensesController'))
  )
  app.use('/building', secured, buildingRoutes)
}
