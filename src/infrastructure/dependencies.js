import { BuildingsRepository } from '../building/repository/buildings.repository'
import { LegacyBuildingRepository } from '../building/models'
import { UpdateBuildingNegotiationStatusService } from '../building/service/update-building-negotiation-status.service'
import { CouchbaseAdapter } from '../db/couchbase.adapter'
import { EventBus } from './event-bus'
import { ScheduledCallsService } from '../scheduled-events/service/scheduled-calls.service'
import { asClass, asValue, createContainer } from 'awilix'
import { registerBuildingDependencies as setupBuildingDependencies } from '../building'
import { setupOwnerDependencies } from '../owner'
import { setupScheduledEventsDependencies } from '../scheduled-events'
import { setupWorksheetDependencies } from '../worksheet'
import { setupCallerDependencies } from '../caller/init'
import { setupUserDependencies } from '../user'
import { setupStockDependencies } from '../stock/stock-di'

export const createLegacyDependenciesContainer = () => {
  const container = {}

  container.buildingRepository = new LegacyBuildingRepository()

  return container
}

export const createDependenciesContainer = (couchbaseBucket, legacyDependenciesContainer, awilixContainer) => {
  const couchbaseAdapter = awilixContainer.resolve('couchbaseAdapter')
  const container = {}

  const buildingRepository = new BuildingsRepository(couchbaseAdapter)
  container.buildingRepository = buildingRepository

  const eventBus = awilixContainer.resolve('eventBus')
  container.eventBus = eventBus
  container.updateBuildingNegotiationStatusService = new UpdateBuildingNegotiationStatusService(buildingRepository, eventBus)
  container.couchbaseAdapter = couchbaseAdapter
  container.scheduledCallsService = new ScheduledCallsService(couchbaseAdapter)

  return container
}

export const createAwilixContainer = (couchbaseBucket, forceMaxQueryConsistency = false) => {
  const awilixContainer = createContainer()

  awilixContainer.register({
    couchbaseBucket: asValue(couchbaseBucket),
    couchbaseAdapter: asValue(new CouchbaseAdapter(couchbaseBucket, forceMaxQueryConsistency)),
    eventBus: asClass(EventBus).singleton()
  })

  setupBuildingDependencies(awilixContainer)
  setupOwnerDependencies(awilixContainer)
  setupScheduledEventsDependencies(awilixContainer)
  setupWorksheetDependencies(awilixContainer)
  setupCallerDependencies(awilixContainer)
  setupUserDependencies(awilixContainer)
  setupStockDependencies(awilixContainer)

  return awilixContainer
}
