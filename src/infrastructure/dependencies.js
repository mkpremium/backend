import { CouchbaseAdapter } from '../db/CouchbaseAdapter'
import { FeaturedOwnerService } from '../featuredOwner/FeaturedOwnerService'
import { PropertyManagerRankingService } from '../PropertyManager/PropertyManagerRankingService'
import { PropertyManagerRepository } from '../PropertyManager/PropertyManagerRepository'
import { StockRepository } from '../stock/StockRepository'

export const createDependenciesContainer = couchbaseBucket => {
  const container = {}
  const couchbaseAdapter = new CouchbaseAdapter(couchbaseBucket)

  const propertyManagersRepository = new PropertyManagerRepository(couchbaseAdapter)
  const stockRepository = new StockRepository(couchbaseBucket)

  container.propertyManagerRankingService = new PropertyManagerRankingService(
    propertyManagersRepository,
    stockRepository
  )

  container.featuredOwnerService = new FeaturedOwnerService(propertyManagersRepository)

  return container
}
