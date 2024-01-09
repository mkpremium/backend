import { AwilixContainer } from 'awilix'
import { EventListener } from '../infrastructure/event-bus'
import { DomainEventCatalog } from '../infrastructure/postgres/domain-event.entity'
import { subscribeToCommand } from '../infrastructure/listeners'

export function ownerEventListeners (eventBus: EventListener, container: AwilixContainer) {
  eventBus.on(
    'virtual_caller.call_finished',
    'owner.discard_bad_contact',
    container.resolve('callFinishedListener'),
  )
  eventBus.on(
    DomainEventCatalog.SCHEDULED_EVENTS__CALL_SCHEDULED,
    'owner.flag_good_contact',
    container.resolve('markGoodContactOnCallScheduled'),
  )
  eventBus.on(
    'virtual-caller.unexisting_phone_found',
    'owner.discard_non_existing_contact',
    container.resolve('discardNonExistingContactListener'),
  )
  eventBus.on(
    'virtual-caller.wrong_phone_format',
    'owner.discard_non_existing_contact',
    container.resolve('discardNonExistingContactListener'),
  )
  eventBus.on(
    'virtual-caller.special_phone_number',
    'owner.discard_non_existing_contact',
    container.resolve('discardNonExistingContactListener'),
  )
  eventBus.on(
    'owner.reset_owner_discarded_contacts_command',
    'owner.reset_owner_discarded_contacts_command_handler',
    container.resolve('resetOwnerBadContactsHandler')
  )
  subscribeToCommand(
    DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_OWNER,
    'importOwnerCommandHandler',
    container,
  )
}
