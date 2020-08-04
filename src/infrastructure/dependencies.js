import { AddProposalService } from '../building/AddProposalService'
import { CommercialsBuildingRepository } from '../building/CommercialsBuildingRepository'
import { ListBuildingProposalsService } from '../building/ListBuildingProposalsService'
import { ListBuildingsService } from '../building/ListBuildingsService'
import { BuildingRepository as LegacyBuildingRepository } from '../building/models'
import { BuildingsRepository } from '../building/BuildingsRepository'
import { UpdateBuildingNegotiationStatusService } from '../building/service/UpdateBuildingNegotiationStatusService'
import { CouchbaseAdapter } from '../db/CouchbaseAdapter'
import { FeaturedOwnerService } from '../featuredOwner/FeaturedOwnerService'
import { UserMeetingsRepository } from '../meeting/UserMeetingsRepository'
import { OwnerRepository as LegacyOwnerRepository } from '../owner/models'
import { OwnerRepository } from '../owner/OwnerRepository'
import { SetOwnerFeaturedContactService } from '../owner/SetOwnerFeaturedContactService'
import { PropertyManagerRankingService } from '../property-manager/PropertyManagerRankingService'
import { PropertyManagerRepository } from '../property-manager/PropertyManagerRepository'
import { ScheduledEventsRepository } from '../scheduled-events/models'
import { CreateMeetingService } from '../scheduled-events/service/CreateMeetingService'

import { StockSalesService } from '../stock/service/StockSalesService'
import { StockRepository } from '../stock/StockRepository'
import { StockRepository as LegacyStockRepository } from '../stock/models'

import { AddFavoriteBuildingService } from '../user/AddFavoriteBuildingService'
import { DeleteFavoriteBuildingService } from '../user/DeleteFavoriteBuildingService'
import { UserRepository } from '../user/UserRepository'
import { GetUserMeetingsService } from '../meeting/GetUserMeetingsService'
import { AdminBuildingRepository } from '../building/repository/AdminBuildingRepository'
import { StockService } from '../stock/service/StockService'
import { EventBus } from './EventBus'
import { WorksheetRepository } from '../worksheet/models/worksheet'
import { SetBuildingSalePriceService } from '../building/service/SetBuildingSalePriceService';

export const createLegacyDependenciesContainer = () => {
  const container = {}

  container.ownerRepository = new LegacyOwnerRepository()
  container.buildingRepository = new LegacyBuildingRepository()
  container.stockRepository = new LegacyStockRepository()
  container.scheduledEventsRepository = new ScheduledEventsRepository()
  container.worksheetRepository = new WorksheetRepository()

  return container
}

export const createDependenciesContainer = (couchbaseBucket, legacyDependenciesContainer) => {
  const couchbaseAdapter = new CouchbaseAdapter(couchbaseBucket)

  const propertyManagersRepository = new PropertyManagerRepository(couchbaseAdapter)
  const stockRepository = new StockRepository(couchbaseAdapter)
  const usersRepository = new UserRepository(couchbaseAdapter)

  const container = {}
  container.propertyManagerRankingService = new PropertyManagerRankingService(
    propertyManagersRepository,
    stockRepository
  )
  container.stockRepository = stockRepository

  container.ownerRepository = new OwnerRepository(couchbaseAdapter)
  container.setOwnerFeaturedContactService = new SetOwnerFeaturedContactService(container.ownerRepository)

  const buildingRepository = new BuildingsRepository(couchbaseAdapter)
  container.featuredOwnerService = new FeaturedOwnerService(buildingRepository)
  container.usersRepository = usersRepository
  container.addFavoriteBuildingService = new AddFavoriteBuildingService(usersRepository)
  container.deleteFavoriteBuildingService = new DeleteFavoriteBuildingService(usersRepository)

  container.addProposalService = new AddProposalService(legacyDependenciesContainer.buildingRepository)
  container.getUserMeetingsService = new GetUserMeetingsService(new UserMeetingsRepository(couchbaseAdapter))
  container.listBuildingsService = new ListBuildingsService(new CommercialsBuildingRepository(couchbaseAdapter))
  container.listBuildingProposalsService = new ListBuildingProposalsService(new CommercialsBuildingRepository(couchbaseAdapter))
  container.adminBuildingRepository = new AdminBuildingRepository(couchbaseAdapter)

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

  return container
}
