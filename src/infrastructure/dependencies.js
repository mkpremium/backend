import { CouchbaseAdapter } from '../db/couchbase.adapter'
import { EventBus } from './event-bus'
import { asClass, asValue, createContainer } from 'awilix'
import { registerBuildingDependencies as setupBuildingDependencies } from '../building'
import { setupOwnerDependencies } from '../owner'
import { setupScheduledEventsDependencies } from '../scheduled-events'
import { setupWorksheetDependencies } from '../worksheet'
import { setupCallerDependencies } from '../caller/init'
import { setupUserDependencies } from '../user'
import { setupStockDependencies } from '../stock/stock-di'

export const createDiContainer = (couchbaseBucket, forceMaxQueryConsistency = false) => {
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
