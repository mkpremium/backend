import { AwilixContainer } from 'awilix'
import { EventBus } from '../infrastructure/event-bus'

export function buildingEventListeners (eventBus: EventBus, container: AwilixContainer) {
  eventBus.on('meeting.created', container.resolve('addNoteToBuilding'))
  eventBus.on('scheduled_events.call_scheduled', container.resolve('addNoteToBuilding'))
  eventBus.on('scheduled_events.call_updated', container.resolve('addNoteToBuilding'))
  eventBus.on('meeting.created', container.resolve('setFeaturedOwnerAndContactFromMeeting'))
  eventBus.on('building.lead_captured', container.resolve('setFeaturedOwnerAndContactFromMeeting'))
  eventBus.on('scheduled_events.call_scheduled', container.resolve('scheduledCallListener'))
  eventBus.on('offer-request.created', container.resolve('setFeaturedOwnerFromOfferRequestListener'))
  eventBus.on('offer-request.created', container.resolve('addNoteToBuilding'))
  eventBus.on('building.proposal_scheduled', container.resolve('proposalScheduledListener'))
  eventBus.on('virtual-caller.sms-received', container.resolve('addSmsNoteListener'))
}
