import { buildingEventListeners } from '../building/listeners'
import { ownerEventListeners } from '../owner/listeners'
import { callsEventListeners } from '../calls/listeners'
import { scheduledEventsEventListeners } from '../scheduled-events/event-listeners'
import { worksheetEventListeners } from '../worksheet/listeners'
import { userEventListeners } from '../user/listeners'
import { statListeners } from '../stats/listeners'
import { EventListener } from './event-bus'

export function startListeners (diContainer) {
  const eventBus = diContainer.resolve('eventBus') as EventListener

  buildingEventListeners(eventBus, diContainer)
  ownerEventListeners(eventBus, diContainer)
  callsEventListeners(eventBus, diContainer)
  scheduledEventsEventListeners(eventBus, diContainer)
  worksheetEventListeners(eventBus, diContainer)
  userEventListeners(eventBus, diContainer)
  statListeners(eventBus)
  try {
    eventBus.on('*', 'events.event_recorder', diContainer.resolve('eventRecorderListener'))
  } catch (e) {
    console.error(`Error resolving event recorder listener: ${e}`)
    console.trace(e)
    throw e
  }
  // eventBus.on('postgres.save_document_command', 'postgres.save_document_command_handler', diContainer.resolve('saveDocumentCommandHandler'))
}
