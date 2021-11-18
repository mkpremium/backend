import { AwilixContainer } from 'awilix'
import { EventListener } from '../infrastructure/event-bus'

export function buildingEventListeners (eventBus: EventListener, container: AwilixContainer) {
  eventBus.on('building.lead_captured', 'building.set_featured_owner', container.resolve('setFeaturedOwnerAndContactFromMeeting'))
  eventBus.on('building.proposal_scheduled', 'building.set_status_to_proposal_scheduled', container.resolve('proposalScheduledListener'))

  eventBus.on('meeting.created', 'building.add_note', container.resolve('addNoteToBuilding'))
  eventBus.on('meeting.created', 'building.set_featured_owner', container.resolve('setFeaturedOwnerAndContactFromMeeting'))
  eventBus.on('scheduled_events.call_scheduled', 'building.add_note', container.resolve('addNoteToBuilding'))
  eventBus.on('scheduled_events.call_scheduled', 'building.set_featured_owner_on_call', container.resolve('scheduledCallListener'))
  eventBus.on('scheduled_events.call_updated', 'building.add_note', container.resolve('addNoteToBuilding'))

  eventBus.on('offer_request.created', 'building.set_featured_owner', container.resolve('setFeaturedOwnerFromOfferRequestListener'))
  eventBus.on('offer_request.created', 'building.add_note', container.resolve('addNoteToBuilding'))
  eventBus.on('virtual_caller.sms_received', 'building.add_note', container.resolve('addSmsNoteListener'))
}
