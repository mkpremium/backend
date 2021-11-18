import { BUILDING_NEGOTIATION_STATUS_CHANGED } from '../building/service/update-building-negotiation-status.service'
import { AwilixContainer } from 'awilix'
import { EventBus } from '../infrastructure/event-bus'

export function scheduledEventsEventListeners (eventBus: EventBus, container: AwilixContainer) {
  eventBus.on(
    'meeting.created',
    'scheduled-events.remove_call',
    container.resolve('removeCallsOnNewMeetingOrOfferRequest')
  )
  eventBus.on(
    'offer-request.created',
    'scheduled-events.remove_call',
    container.resolve('removeCallsOnNewMeetingOrOfferRequest'),
  )
  eventBus.on(
    BUILDING_NEGOTIATION_STATUS_CHANGED,
    'scheduled-events.remove_call',
    container.resolve('removeScheduledCallsOnOwnerRefusal')
  )
  eventBus.on(
    'virtual-caller.sms-received',
    'scheduled-events.schedule_call',
    container.resolve('scheduledCallFromOwnerMessage')
  )
  eventBus.on(
    'owner.contact_status_changed',
    'scheduled-events.remove_call',
    container.resolve('removeScheduledCallOnDiscardedContact')
  )
}
