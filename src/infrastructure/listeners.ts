import { buildingEventListeners } from '../building/listeners'
import { ownerEventListeners } from '../owner/listeners'
import { scheduledEventsEventListeners } from '../scheduled-events/event-listeners'
import { worksheetEventListeners } from '../worksheet/listeners'
import { userEventListeners } from '../user/listeners'
import { EventListener } from './event-bus'
import { DomainEventCatalog } from './postgres/domain-event.entity'
import { AwilixContainer } from 'awilix'
import { couchbaseToPostgresProcess } from './postgres/couchbase-to-postgres.process'
import { Logger } from 'winston'

export async function startListeners (diContainer) {
  const eventBus = diContainer.resolve('eventBus') as EventListener

  buildingEventListeners(eventBus, diContainer)
  ownerEventListeners(eventBus, diContainer)
  scheduledEventsEventListeners(eventBus, diContainer)
  worksheetEventListeners(eventBus, diContainer)
  userEventListeners(eventBus, diContainer)

  const migrationProcess = diContainer.resolve('couchbaseToPostgresProcess') as ReturnType<typeof couchbaseToPostgresProcess>
  const logger = diContainer.resolve('logger') as Logger
  if (process.env.TRIGGER_OPERATORS_MIGRATION === 'true') {
    await migrationProcess.triggerOperatorsMigration()
  }
  if (process.env.TRIGGER_BUILDINGS_MIGRATION === 'true') {
    logger.info('Triggering building migration')
    await migrationProcess.triggerBuildingMigration()
  }
  if (process.env.TRIGGER_SCHEDULED_EVENTS_MIGRATION === 'true') {
    logger.info('Triggering scheduled events migration')
    await migrationProcess.triggerScheduledEventMigration()
  }
  if (process.env.TRIGGER_BUILDING_PROPOSALS_MIGRATION === 'true') {
    logger.info('Triggering building proposals migration')
    await migrationProcess.triggerBuildingProposalsImport()
  }
  if (process.env.TRIGGER_WORKSHEET_QUEUES_MIGRATION === 'true') {
    logger.info('Triggering worksheet queues migration')
    await migrationProcess.triggerWorksheetQueueImport()
  }
  if (process.env.TRIGGER_STOCK_MIGRATION === 'true') {
    logger.info('Triggering stock migration')
    await migrationProcess.triggerStockMigration()
  }
  if (process.env.TRIGGER_BUILDING_OWNER_MIGRATION === 'true') {
    logger.info('Triggering building owner migration')
    await migrationProcess.triggerAllOwnerMigration()
  }
}

export function subscribeToCommand (command: DomainEventCatalog, eventBus: EventListener, service: any): void
export function subscribeToCommand (command: DomainEventCatalog, serviceHandlerName: string, container: AwilixContainer): void
export function subscribeToCommand (
  command: DomainEventCatalog,
  serviceHandlerNameOrEventBus: string | EventListener,
  containerOrService: AwilixContainer | unknown) {
  let service: (event: unknown) => Promise<void>
  let eventBus: EventListener
  if (typeof serviceHandlerNameOrEventBus === 'string') {
    service = (containerOrService as AwilixContainer).resolve(serviceHandlerNameOrEventBus)
    eventBus = (containerOrService as AwilixContainer).resolve('eventBus') as EventListener
  } else {
    service = containerOrService as (event: unknown) => Promise<void>
    eventBus = serviceHandlerNameOrEventBus
  }

  eventBus.on(
    command,
    commandHandlerName(command),
    service
  )
}

export function commandHandlerName (command: DomainEventCatalog) {
  return `${command}_handler`
}
