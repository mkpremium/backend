import { AddProposalService } from '../building/AddProposalService'
import { BuildingRepository } from '../building/models'
import { CouchbaseAdapter } from '../db/CouchbaseAdapter'
import { FeaturedOwnerService } from '../featuredOwner/FeaturedOwnerService'
import { UserMeetingsRepository } from '../meeting/UserMeetingsRepository'
import { OwnerRepository } from '../owner/models'
import { PropertyManagerRankingService } from '../PropertyManager/PropertyManagerRankingService'
import { PropertyManagerRepository } from '../PropertyManager/PropertyManagerRepository'
import { StockRepository } from '../stock/StockRepository'
import { AddFavoriteBuildingService } from '../user/AddFavoriteBuildingService'
import { UserRepository } from '../user/UserRepository'
import { GetUserMeetingsService } from '../meeting/GetUserMeetingsService'

export const createDependenciesContainer = couchbaseBucket => {
  const couchbaseAdapter = new CouchbaseAdapter(couchbaseBucket)

  const propertyManagersRepository = new PropertyManagerRepository(couchbaseAdapter)
  const stockRepository = new StockRepository(couchbaseAdapter)
  const usersRepository = new UserRepository(couchbaseAdapter)

  const container = {}
  container.propertyManagerRankingService = new PropertyManagerRankingService(
    propertyManagersRepository,
    stockRepository
  )

  container.featuredOwnerService = new FeaturedOwnerService(propertyManagersRepository)
  container.usersRepository = usersRepository
  container.addFavoriteBuildingService = new AddFavoriteBuildingService(usersRepository)

  container.buildingRepository = new BuildingRepository()
  container.addProposalService = new AddProposalService(container.buildingRepository)
  container.getUserMeetingsService = new GetUserMeetingsService(new UserMeetingsRepository(couchbaseAdapter))

  container.ownerRepository = new OwnerRepository()

  return container
}
