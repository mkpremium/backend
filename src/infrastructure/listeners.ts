import { buildingEventListeners } from '../building/listeners'
import { ownerEventListeners } from '../owner/listeners'
import { callsEventListeners } from '../calls/listeners'
import { scheduledEventsEventListeners } from '../scheduled-events/event-listeners'
import { worksheetEventListeners } from '../worksheet/listeners'
import { userEventListeners } from '../user/listeners'
import { statListeners } from '../stats/listeners'
import { EventBus } from './event-bus'

export function startListeners (diContainer) {
  const eventBus = diContainer.resolve('eventBus') as EventBus

  buildingEventListeners(eventBus, diContainer)
  ownerEventListeners(eventBus, diContainer)
  callsEventListeners(eventBus, diContainer)
  scheduledEventsEventListeners(eventBus, diContainer)
  worksheetEventListeners(eventBus, diContainer)
  userEventListeners(eventBus, diContainer)
  statListeners(eventBus)
}
