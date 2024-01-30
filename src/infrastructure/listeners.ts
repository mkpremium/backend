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
  eventBus.on('*', 'events.event_recorder', diContainer.resolve('eventRecorderListener'))

  const migrationProcess = diContainer.resolve('couchbaseToPostgresProcess') as ReturnType<typeof couchbaseToPostgresProcess>
  const logger = diContainer.resolve('logger') as Logger
  if (process.env.TRIGGER_OPERATORS_MIGRATION === "true") {
    await migrationProcess.triggerOperatorsMigration()
  }
  if (process.env.TRIGGER_BUILDINGS_MIGRATION === "true") {
    logger.info('Triggering building migration')
    await migrationProcess.triggerBuildingMigration()
  }
  if (process.env.TRIGGER_SCHEDULED_EVENTS_MIGRATION === "true") {
    logger.info('Triggering scheduled events migration')
    await migrationProcess.triggerScheduledEventMigration()
  }
  if (process.env.TRIGGER_WORKSHEET_QUEUES_MIGRATION === "true") {
    logger.info('Triggering worksheet queues migration')
    await migrationProcess.triggerWorksheetQueueImport()
  }
}

export function subscribeToCommand (command: DomainEventCatalog, eventBus: EventListener, service: any): void
export function subscribeToCommand (command: DomainEventCatalog, serviceHandlerName: string, container: AwilixContainer): void
export function subscribeToCommand (
  command: DomainEventCatalog,
  serviceHandlerNameOrEventBus: string | EventListener,
  containerOrService: AwilixContainer | any) {
  let service: any
  let eventBus: EventListener
  if (typeof serviceHandlerNameOrEventBus === 'string') {
    service = containerOrService.resolve(serviceHandlerNameOrEventBus)
    eventBus = containerOrService.resolve('eventBus') as EventListener
  } else {
    service = containerOrService
    eventBus = serviceHandlerNameOrEventBus
  }

  eventBus.on(
    command,
    commandHandlerName(command),
    service
  )
}

export function commandHandlerName(command: DomainEventCatalog) {
  return `${command}_handler`
}
