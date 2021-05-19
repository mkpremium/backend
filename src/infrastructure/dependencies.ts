import { CouchbaseAdapter } from '../db/couchbase.adapter'
import { EventBus } from './event-bus'
import { asClass, asFunction, asValue, createContainer } from 'awilix'
import { setupBuildingDependencies } from '../building/dependencies'
import { setupOwnerDependencies } from '../owner'
import { setupScheduledEventsDependencies } from '../scheduled-events'
import { setupWorksheetDependencies } from '../worksheet'
import { setupCallerDependencies } from '../caller/init'
import { setupUserDependencies } from '../user'
import { setupStockDependencies } from '../stock/stock-di'
import { Bucket } from 'couchbase'
import { setupHistoryDependencies } from '../history/dependencies'
import { initLogger } from './logger'

export const createDiContainer = (couchbaseBucket: Bucket) => {
  const container = createContainer()

  container.register({
    couchbaseBucket: asValue(couchbaseBucket),
    couchbaseAdapter: asClass(CouchbaseAdapter).classic().singleton(),
    eventBus: asClass(EventBus).classic().singleton(),
    logger: asFunction(initLogger).singleton(),
  })

  setupBuildingDependencies(container)
  setupOwnerDependencies(container)
  setupScheduledEventsDependencies(container)
  setupWorksheetDependencies(container)
  setupCallerDependencies(container)
  setupUserDependencies(container)
  setupStockDependencies(container)
  setupHistoryDependencies(container)

  return container
}
