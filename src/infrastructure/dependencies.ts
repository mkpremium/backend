import type { AwilixContainer } from 'awilix'
import { aliasTo, asClass, asFunction, asValue, createContainer } from 'awilix'
import { setupBuildingDependencies } from '../building/dependencies'
import { setupCallerDependencies } from '../caller/init'
import { setupStockDependencies } from '../stock/dependencies'
import { initLogger } from './logger'
import { setupWorksheetDependencies } from '../worksheet/dependencies'
import { setupEmailDependencies } from '../email/dependencies'
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
import { initializeDataSource } from '../data-source'
import type { DataSource } from 'typeorm'
import { setupContactsDependencies } from '../contacts/dependencies'
import { couchbaseToPostgresProcess } from './postgres/couchbase-to-postgres.process'
import { BuildingImagesImporterService } from './service/building-images-importer.service'
import { BuildingOwnerImportTriggerService } from './service/building-owner-import-trigger.service'
import { BuildingProposalsImporterService } from './service/building-proposals-importer.service'
import { BuildingWorkSheetsImporterService } from './service/building-worksheets-importer.service'
import { BuildingImportTriggerService } from './service/building-import-trigger.service'
import { CouchbaseDocumentRepository } from './postgres/couchbase-document.repository'
import { ScheduledEventImportTriggerService } from './service/scheduled-event-import-trigger.service'
import { WorksheetQueueImportTriggerService } from './postgres/worksheet-queue-import-trigger.service'
import { BuildingProposalsImportTriggerService } from './service/building-proposals-importer-trigger.service'
import { AddUserService } from '../user/service/add-user.service'
import { AddOwnerService } from '../owner/service/add-owner.service'
import { CallService } from '../retell/service/call-service'
import { ContactService } from '../retell/service/contact-service'
import Retell from 'retell-sdk'
import { setupCallDependencies } from '../retell/dependencies'

export async function createDiContainer () {
  const container = createContainer()
  const dataSource = await initializeDataSource()

  await setupContainer(container, dataSource)

  return container
}

export async function setupContainer (container: AwilixContainer, dataSource: DataSource) {
  await setupInfrastructureDependencies(container, dataSource)
  await setupBuildingDependencies(container)
  setupOwnerDependencies(container)
  setupContactsDependencies(container)
  await setupScheduledEventsDependencies(container)
  await setupWorksheetDependencies(container)
  setupCallerDependencies(container)
  await setupUserDependencies(container)
  await setupStockDependencies(container)
  setupEmailDependencies(container)
  setupFlipperDependencies(container)
  await setupCallDependencies(container)
}

async function setupInfrastructureDependencies (container: AwilixContainer, dataSource: DataSource) {
  container.register({
    ormDataSource: asValue(dataSource),
    entityManager: asValue(dataSource?.manager),
    consistencyDelay: asValue(parseInt(process.env.EVENTUAL_CONSISTENCY_DELAY)),
    eventNamingPolicy: asValue(eventNamingPolicy),
    sqsClient: asValue(new aws.SQS({ region: 'eu-west-1' })),
    eventsQueueUrl: asValue(process.env.EVENTS_QUEUE_URL),
    retellClient: asValue(
      new Retell({
        apiKey: process.env.RETELL_API_KEY!
      })
    ),
    eventPoller: asClass(EventPoller).classic().singleton(),
    listenersRegistry: asClass(ListenersRegistry).classic().singleton(),
    sqsEventBus: asClass(SqsBus).classic().singleton(),
    eventEmitterBus: asClass(EventEmitterBus).classic().singleton(),
    composedEventBus: asClass(ComposedBus).classic().singleton(),
    eventBus: aliasTo(['test', 'development'].includes(process.env.NODE_ENV) ? 'eventEmitterBus' : 'sqsEventBus'),
    logger: asFunction(initLogger).singleton(),
    addUserService: asClass(AddUserService).singleton(),
    addOwnerService: asClass(AddOwnerService).singleton(),
    callService: asClass(CallService).singleton(),
    contactService: asClass(ContactService).singleton(),
    couchbaseToPostgresProcess: asFunction(couchbaseToPostgresProcess).singleton(),
    buildingImportTriggerService: asClass(BuildingImportTriggerService).classic().singleton(),
    scheduledEventImportTriggerService: asClass(ScheduledEventImportTriggerService).classic().singleton(),
    worksheetQueueImportTriggerService: asClass(WorksheetQueueImportTriggerService).classic().singleton(),
    buildingImagesImporterService: asClass(BuildingImagesImporterService).classic().singleton(),
    buildingOwnerImportTriggerService: asClass(BuildingOwnerImportTriggerService).classic().singleton(),
    buildingProposalsImporterService: asClass(BuildingProposalsImporterService).classic().singleton(),
    buildingProposalsImportTriggerService: asClass(BuildingProposalsImportTriggerService).classic().singleton(),
    buildingWorkSheetsImporterService: asClass(BuildingWorkSheetsImporterService).classic().singleton(),
    couchbaseDocumentRepository: asClass(CouchbaseDocumentRepository).classic().singleton()
  })
}
