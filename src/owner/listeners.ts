import { AwilixContainer } from 'awilix'
import { EventBus } from '../infrastructure/event-bus'

export function ownerEventListeners (eventBus: EventBus, container: AwilixContainer) {
  eventBus.on(
    'virtual-caller.call_finished',
    'owner.discard_bad_contact',
    container.resolve('callFinishedListener'),
  )
  eventBus.on(
    'scheduled_events.call_scheduled',
    'owner.flag_good_contact',
    container.resolve('markGoodContactOnCallScheduled'))
}
