import { CouchbaseAdapter } from '../db/couchbase.adapter'
import { asClass, asFunction, asValue, createContainer } from 'awilix'
import { setupBuildingDependencies } from '../building/dependencies'
import { setupCallerDependencies } from '../caller/init'
import { setupStockDependencies } from '../stock/stock-di'
import { Bucket } from 'couchbase'
import { setupHistoryDependencies } from '../history/dependencies'
import { initLogger } from './logger'
import { setupWorksheetDependencies } from '../worksheet/dependencies'
import { setupEmailDependencies } from '../email/dependencies'
import { setupCallsDependencies } from '../calls/dependencies'
import { setupOwnerDependencies } from '../owner/dependencies'
import { setupScheduledEventsDependencies } from '../scheduled-events/dependencies'
import { setupFlipperDependencies } from '../flipper/dependencies'
import { setupUserDependencies } from '../user/dependencies'
import { EventEmitterBus } from './event-bus/event-emitter-bus'
import { eventNamingPolicy } from './event-bus/event-naming-policy'

export const createDiContainer = (couchbaseBucket: Bucket) => {
  const container = createContainer()

  container.register({
    couchbaseBucket: asValue(couchbaseBucket),
    couchbaseAdapter: asClass(CouchbaseAdapter).classic().singleton(),
    consistencyDelay: asValue(parseInt(process.env.EVENTUAL_CONSISTENCY_DELAY)),
    eventNamingPolicy: asValue(eventNamingPolicy),
    eventBus: asClass(EventEmitterBus).inject(() => ({})).classic().singleton(),
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
  setupEmailDependencies(container)
  setupCallsDependencies(container)
  setupFlipperDependencies(container)

  return container
}
