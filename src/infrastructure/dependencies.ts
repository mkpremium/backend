import { CouchbaseAdapter } from '../db/couchbase.adapter'
import { EventBus } from './event-bus'
import { asClass, asValue, createContainer } from 'awilix'
import { setupBuildingDependencies } from '../building/dependencies'
import { setupOwnerDependencies } from '../owner'
import { setupScheduledEventsDependencies } from '../scheduled-events'
import { setupWorksheetDependencies } from '../worksheet'
import { setupCallerDependencies } from '../caller/init'
import { setupUserDependencies } from '../user'
import { setupStockDependencies } from '../stock/stock-di'
import { Bucket } from 'couchbase'

export const createDiContainer = (couchbaseBucket: Bucket) => {
  const awilixContainer = createContainer()

  awilixContainer.register({
    couchbaseBucket: asValue(couchbaseBucket),
    couchbaseAdapter: asClass(CouchbaseAdapter).classic().singleton(),
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
