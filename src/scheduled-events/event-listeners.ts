import { AwilixContainer } from 'awilix'
import { EventListener } from '../infrastructure/event-bus'
import { DomainEventCatalog } from '../infrastructure/postgres/domain-event.entity'

export function scheduledEventsEventListeners (eventBus: EventListener, container: AwilixContainer) {
  eventBus.on(
    DomainEventCatalog.SCHEDULED_EVENTS__MEETING_CREATED,
    'scheduled_events.remove_call',
    container.resolve('removeCallsOnNewMeetingOrOfferRequest')
  )
  eventBus.on(
    DomainEventCatalog.OFFER_REQUEST__CREATED,
    'scheduled_events.remove_call',
    container.resolve('removeCallsOnNewMeetingOrOfferRequest'),
  )
  eventBus.on(
    DomainEventCatalog.BUILDING__NEGOTIATION_STATUS_CHANGED,
    'scheduled_events.remove_call',
    container.resolve('removeScheduledCallsOnOwnerRefusal')
  )
  // eventBus.on(
  //   'virtual_caller.sms_received',
  //   'scheduled_events.schedule_call',
  //   container.resolve('scheduledCallFromOwnerMessage')
  // )
  eventBus.on(
    DomainEventCatalog.OWNER__CONTACT_STATUS_CHANGED,
    'scheduled_events.remove_call',
    container.resolve('removeScheduledCallOnDiscardedContact')
  )
}
