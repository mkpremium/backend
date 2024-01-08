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

export function startListeners (diContainer) {
  const eventBus = diContainer.resolve('eventBus') as EventListener

  buildingEventListeners(eventBus, diContainer)
  ownerEventListeners(eventBus, diContainer)
  callsEventListeners(eventBus, diContainer)
  scheduledEventsEventListeners(eventBus, diContainer)
  worksheetEventListeners(eventBus, diContainer)
  userEventListeners(eventBus, diContainer)
  statListeners(eventBus)
  eventBus.on('*', 'events.event_recorder', diContainer.resolve('eventRecorderListener'))
  subscribeToCommand(
    DomainEventCatalog.CMD__POSTGRES__MIGRATION__SAVE_DOCUMENTS,
    'saveDocumentsCommandHandler',
    diContainer
  )
}

export function subscribeToCommand (command: DomainEventCatalog, serviceHandlerName: string, container: AwilixContainer) {
  const eventBus = container.resolve('eventBus') as EventListener
  eventBus.on(
    command,
    `${command}_Handler`,
    container.resolve(serviceHandlerName)
  )
}
