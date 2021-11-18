import { AwilixContainer } from 'awilix'
import { EventBus } from '../infrastructure/event-bus'

export function ownerEventListeners (eventBus: EventBus, container: AwilixContainer) {
  eventBus.on('virtual-caller.call_finished', container.resolve('callFinishedListener'))
  eventBus.on('scheduled_events.call_scheduled', container.resolve('markGoodContactOnCallScheduled'))
}
