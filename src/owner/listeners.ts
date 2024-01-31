import { AwilixContainer } from 'awilix'
import { EventListener } from '../infrastructure/event-bus'
import { DomainEventCatalog } from '../infrastructure/postgres/domain-event.entity'

export function ownerEventListeners (eventBus: EventListener, container: AwilixContainer) {
  eventBus.on(
    DomainEventCatalog.SCHEDULED_EVENTS__CALL_SCHEDULED,
    'owner.flag_good_contact',
    container.resolve('markGoodContactOnCallScheduled')
  )
  eventBus.on(
    'owner.reset_owner_discarded_contacts_command',
    'owner.reset_owner_discarded_contacts_command_handler',
    container.resolve('resetOwnerBadContactsHandler')
  )
}
