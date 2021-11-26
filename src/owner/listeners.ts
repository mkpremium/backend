import { AwilixContainer } from 'awilix'
import { EventListener } from '../infrastructure/event-bus'

export function ownerEventListeners (eventBus: EventListener, container: AwilixContainer) {
  eventBus.on(
    'virtual_caller.call_finished',
    'owner.discard_bad_contact',
    container.resolve('callFinishedListener'),
  )
  eventBus.on(
    'scheduled_events.call_scheduled',
    'owner.flag_good_contact',
    container.resolve('markGoodContactOnCallScheduled'),
  )
  eventBus.on(
    'virtual-caller.unexisting_phone_found',
    'owner.discard_non_existing_contact',
    container.resolve('discardNonExistingContactListener'),
  )
}
