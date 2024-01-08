import { AwilixContainer } from 'awilix'
import { EventListener } from '../infrastructure/event-bus'
import { DomainEventCatalog } from '../infrastructure/postgres/domain-event.entity'
import { subscribeToCommand } from '../infrastructure/listeners'

export function buildingEventListeners (eventBus: EventListener, container: AwilixContainer) {
  eventBus.on(DomainEventCatalog.BUILDING__LEAD_CAPTURED, 'building.set_featured_owner', container.resolve('setFeaturedOwnerAndContactFromMeeting'))
  eventBus.on(DomainEventCatalog.BUILDING__PROPOSAL_SCHEDULED, 'building.set_status_to_proposal_scheduled', container.resolve('proposalScheduledListener'))

  eventBus.on('meeting.created', 'building.add_note', container.resolve('addNoteToBuilding'))
  eventBus.on('meeting.created', 'building.set_featured_owner', container.resolve('setFeaturedOwnerAndContactFromMeeting'))
  eventBus.on(DomainEventCatalog.SCHEDULED_EVENTS__CALL_SCHEDULED, 'building.add_note', container.resolve('addNoteToBuilding'))
  eventBus.on(DomainEventCatalog.SCHEDULED_EVENTS__CALL_SCHEDULED, 'building.set_featured_owner_on_call', container.resolve('scheduledCallListener'))
  eventBus.on(DomainEventCatalog.SCHEDULED_EVENTS__CALL_UPDATED, 'building.add_note', container.resolve('addNoteToBuilding'))

  eventBus.on(DomainEventCatalog.OFFER_REQUEST__CREATED, 'building.set_featured_owner', container.resolve('setFeaturedOwnerFromOfferRequestListener'))
  eventBus.on(DomainEventCatalog.OFFER_REQUEST__CREATED, 'building.add_note', container.resolve('addNoteToBuilding'))
  eventBus.on('virtual_caller.sms_received', 'building.add_note', container.resolve('addSmsNoteListener'))

  subscribeToCommand(
    DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_BUILDING,
    'importBuildingCommandHandler',
    container,
  )
}
