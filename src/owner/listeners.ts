import { AwilixContainer } from 'awilix'
import { EventBus } from '../infrastructure/event-bus'

export function ownerEventListeners (container: AwilixContainer) {
  const eventBus: EventBus = container.resolve('eventBus')

  eventBus.on('virtual-caller.call_finished', container.resolve('callFinishedListener'))
  eventBus.on('scheduled_events.call_scheduled', container.resolve('markGoodContactOnCallScheduled'))
}
