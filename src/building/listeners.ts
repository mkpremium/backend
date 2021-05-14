import { AwilixContainer } from 'awilix'
import { EventBus } from '../infrastructure/event-bus'

export function buildingEventListeners(container: AwilixContainer) {
  const eventBus: EventBus = container.resolve('eventBus')

  eventBus.on('worksheet.made_available', container.resolve('worksheetMadeAvailableListener'))
  eventBus.on('meeting.created', container.resolve('addNoteToBuilding'))
  eventBus.on('scheduled_events.call_scheduled', container.resolve('addNoteToBuilding'))
  eventBus.on('meeting.created', container.resolve('setFeaturedOwnerAndContactFromMeeting'))
  eventBus.on('scheduled_events.call_scheduled', container.resolve('scheduledCallListener'))
  eventBus.on('offer-request.created', container.resolve('setFeaturedOwnerFromOfferRequestListener'))
  eventBus.on('offer-request.created', container.resolve('addNoteToBuilding'))
}
