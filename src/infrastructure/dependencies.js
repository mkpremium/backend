import aws from 'aws-sdk'
import { metadataS3Config } from '../../config'
import { AddProposalService } from '../building/service/add-proposal.service'
import { BuildingsRepository } from '../building/repository/buildings.repository'
import { CommercialsBuildingRepository } from '../building/repository/commercials-building.repository'
import { ListBuildingsService } from '../building/service/list-buildings.service'
import { BuildingRepository as LegacyBuildingRepository } from '../building/models'
import { AdminBuildingRepository } from '../building/repository/admin-building.repository'
import { BuildingDocumentsRepository } from '../building/repository/building-documents.repository'
import { GetDocumentsSignedURLService } from '../building/service/get-documents-signed-URL.service'
import { SetBuildingSalePriceService } from '../building/service/set-building-sale-price.service'
import { UpdateBuildingNegotiationStatusService } from '../building/service/update-building-negotiation-status.service'
import { CouchbaseAdapter } from '../db/couchbase.adapter'
import { FeaturedOwnerService } from '../featuredOwner/FeaturedOwnerService'
import { GetUserMeetingsService } from '../meeting/GetUserMeetingsService'
import { UserMeetingsRepository } from '../meeting/UserMeetingsRepository'
import { OwnerRepository as LegacyOwnerRepository } from '../owner/models'
import { PropertyManagerRankingService } from '../property-manager/PropertyManagerRankingService'
import { PropertyManagerRepository } from '../property-manager/PropertyManagerRepository'
import { ScheduledEventsRepository } from '../scheduled-events/repository/ScheduleEventsRepository'
import { CreateMeetingService } from '../scheduled-events/service/create-meeting.service'
import { StockRepository as LegacyStockRepository } from '../stock/models'

import { StockSalesService } from '../stock/service/StockSalesService'
import { StockService } from '../stock/service/StockService'
import { StockRepository } from '../stock/StockRepository'
import { LegacyWorksheetQueueRepository } from '../worksheet/models/queue-repository'
import { LegacyWorksheetRepository } from '../worksheet/models/worksheet-repository'
import { WorksheetRepository } from '../worksheet/repository/worksheet.repository'
import { EventBus } from './event-bus'
import { MetadataRepository } from '../building/repository/metadata.repository'
import { ScheduledCallsService } from '../scheduled-events/service/scheduled-calls.service'
import { OwnerRepository } from '../owner/repository/owner.repository'
import { SetOwnerFeaturedContactService } from '../owner/service/set-featured-contact.service'
import { ListBuildingProposalsService } from '../building/service/list-building-proposals.service'
import { asValue, createContainer } from 'awilix'

export const createLegacyDependenciesContainer = () => {
  const container = {}

  container.ownerRepository = new LegacyOwnerRepository()
  container.buildingRepository = new LegacyBuildingRepository()
  container.stockRepository = new LegacyStockRepository()
  container.scheduledEventsRepository = new ScheduledEventsRepository()
  container.worksheetRepository = new LegacyWorksheetRepository()
  container.metadataRepository = new MetadataRepository()
  container.worksheetQueueRepository = new LegacyWorksheetQueueRepository(container.worksheetRepository)

  return container
}

export const createDependenciesContainer = (couchbaseBucket, legacyDependenciesContainer) => {
  const couchbaseAdapter = new CouchbaseAdapter(couchbaseBucket)

  const propertyManagersRepository = new PropertyManagerRepository(couchbaseAdapter)
  const stockRepository = new StockRepository(couchbaseAdapter)

  const container = {}
  container.propertyManagerRankingService = new PropertyManagerRankingService(
    propertyManagersRepository,
    stockRepository
  )
  container.stockRepository = stockRepository

  container.ownerRepository = new OwnerRepository(couchbaseAdapter)
  container.setOwnerFeaturedContactService = new SetOwnerFeaturedContactService(container.ownerRepository)

  const buildingRepository = new BuildingsRepository(couchbaseAdapter)
  container.buildingRepository = buildingRepository
  container.featuredOwnerService = new FeaturedOwnerService(buildingRepository)

  container.addProposalService = new AddProposalService(legacyDependenciesContainer.buildingRepository)
  container.getUserMeetingsService = new GetUserMeetingsService(new UserMeetingsRepository(couchbaseAdapter))
  container.listBuildingsService = new ListBuildingsService(new CommercialsBuildingRepository(couchbaseAdapter))
  container.listBuildingProposalsService = new ListBuildingProposalsService(new CommercialsBuildingRepository(couchbaseAdapter))
  container.adminBuildingRepository = new AdminBuildingRepository(couchbaseAdapter)

  container.worksheetRepository = new WorksheetRepository(couchbaseAdapter) // used by test-harness

  const eventBus = new EventBus()
  container.eventBus = eventBus
  container.updateBuildingNegotiationStatusService = new UpdateBuildingNegotiationStatusService(buildingRepository, eventBus)

  container.createMeetingService = new CreateMeetingService(
    legacyDependenciesContainer.scheduledEventsRepository,
    buildingRepository,
    eventBus
  )

  container.stockSalesService = new StockSalesService(
    container.updateBuildingNegotiationStatusService,
    legacyDependenciesContainer.buildingRepository,
    legacyDependenciesContainer.stockRepository
  )

  container.setBuildingSalePriceService = new SetBuildingSalePriceService(buildingRepository)

  container.couchbaseAdapter = couchbaseAdapter

  container.stockService = new StockService(
    legacyDependenciesContainer.stockRepository,
    container.updateBuildingNegotiationStatusService
  )

  container.buildingDocumentsRepository = new BuildingDocumentsRepository(couchbaseAdapter)
  const buildingDocumentsS3Client = new aws.S3({
    signatureVersion: 'v4',
    region: metadataS3Config.region
  })
  container.getDocumentsSignedURLService = new GetDocumentsSignedURLService(
    container.buildingDocumentsRepository,
    buildingDocumentsS3Client,
    metadataS3Config.bucket
  )

  container.scheduledCallsService = new ScheduledCallsService(couchbaseAdapter)

  return container
}

export const createAwilixContainer = couchbaseBucket => {
  const awilixContainer = createContainer()

  awilixContainer.register({
    couchbaseBucket: asValue(couchbaseBucket),
    couchbaseAdapter: asValue(new CouchbaseAdapter(couchbaseBucket))
  })

  return awilixContainer
}
