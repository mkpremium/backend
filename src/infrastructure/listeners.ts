import { buildingEventListeners } from '../building/listeners'
import { ownerEventListeners } from '../owner/listeners'
import { callsEventListeners } from '../calls/listeners'
import { scheduledEventsEventListeners } from '../scheduled-events/event-listeners'
import { worksheetEventListeners } from '../worksheet/listeners'
import { userEventListeners } from '../user/listeners'
import { statListeners } from '../stats/listeners'
import { EventListener } from './event-bus'
import { DomainEventCatalog } from './postgres/domain-event.entity'
import { AwilixContainer } from 'awilix'
import { couchbaseToPostgresSaga } from './postgres/couchbase-to-postgres.saga'
import { Logger } from 'winston'

export async function startListeners (diContainer) {
  const eventBus = diContainer.resolve('eventBus') as EventListener

  buildingEventListeners(eventBus, diContainer)
  ownerEventListeners(eventBus, diContainer)
  callsEventListeners(eventBus, diContainer)
  scheduledEventsEventListeners(eventBus, diContainer)
  worksheetEventListeners(eventBus, diContainer)
  userEventListeners(eventBus, diContainer)
  statListeners(eventBus)
  eventBus.on('*', 'events.event_recorder', diContainer.resolve('eventRecorderListener'))

  const migrationSaga = diContainer.resolve('couchbaseToPostgresSaga') as ReturnType<typeof couchbaseToPostgresSaga>
  if (process.env.TRIGGER_MIGRATION) {
    const logger = diContainer.resolve('logger') as Logger
    logger.info('Triggering building migration')
    await migrationSaga.triggerBuildingMigration()
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
    `${command}_handler`,
    service
  )
}
