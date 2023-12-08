import { CouchbaseAdapter } from '../db/couchbase.adapter'
import { aliasTo, asClass, asFunction, asValue, AwilixContainer, createContainer } from 'awilix'
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
import { SqsBus } from './event-bus/sqs-bus'
import aws from 'aws-sdk'
import { ComposedBus } from './event-bus/composed-bus'
import { ListenersRegistry } from './event-bus/listeners-registry'
import { EventPoller } from './event-bus/event-poller'
import { createEventRecorderListener } from './event-bus/event-recorder.listener'
import { saveDocumentsCommandHandler } from './postgres/save-documents-command-handler'
import { initializeDataSource } from '../data-source'
import { DataSource } from 'typeorm'
import { connectCouchbaseBucket } from '../db/connect-couchbase-bucket'
import { setupContactsDependencies } from '../contacts/dependencies'
import { Database } from './database'

export async function createDiContainer (database: Database) {
  const container = createContainer()
  const [ couchbaseBucket, dataSource ] = await Promise.all([
    connectCouchbaseBucket(),
    initializeDataSource()
  ])

  setupContainer(container, couchbaseBucket, dataSource, database === 'postgres')

  return container
}

export function setupContainer (
  container: AwilixContainer, couchbaseBucket: Bucket, dataSource: DataSource, usePostgres: boolean) {
  container.register('usePostgres', asValue(usePostgres))
  setupInfrastructureDependencies(container, couchbaseBucket, dataSource)
  setupBuildingDependencies(container, usePostgres)
  setupOwnerDependencies(container, usePostgres)
  setupContactsDependencies(container)
  setupScheduledEventsDependencies(container)
  setupWorksheetDependencies(container, usePostgres)
  setupCallerDependencies(container)
  setupUserDependencies(container)
  setupStockDependencies(container)
  setupHistoryDependencies(container)
  setupEmailDependencies(container)
  setupCallsDependencies(container)
  setupFlipperDependencies(container)
}

function setupInfrastructureDependencies (container: AwilixContainer, couchbaseBucket: Bucket, dataSource: DataSource) {
  container.register({
    couchbaseBucket: asValue(couchbaseBucket),
    couchbaseAdapter: asClass(CouchbaseAdapter).classic(),
    ormDataSource: asValue(dataSource),
    consistencyDelay: asValue(parseInt(process.env.EVENTUAL_CONSISTENCY_DELAY)),
    eventNamingPolicy: asValue(eventNamingPolicy),
    sqsClient: asValue(new aws.SQS({ region: 'eu-west-1' })),
    eventsQueueUrl: asValue(process.env.EVENTS_QUEUE_URL),
    eventPoller: asClass(EventPoller).classic().singleton(),
    listenersRegistry: asClass(ListenersRegistry).classic().singleton(),
    sqsEventBus: asClass(SqsBus).classic().singleton(),
    eventEmitterBus: asClass(EventEmitterBus).classic().singleton(),
    composedEventBus: asClass(ComposedBus).classic().singleton(),
    eventBus: aliasTo(process.env.NODE_ENV === 'test' ? 'eventEmitterBus' : 'sqsEventBus'),
    eventRecorderListener: asFunction(createEventRecorderListener),
    saveDocumentsCommandHandler: asFunction(saveDocumentsCommandHandler),
    logger: asFunction(initLogger).singleton(),
  })
}
