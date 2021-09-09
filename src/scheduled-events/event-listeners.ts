import { BUILDING_NEGOTIATION_STATUS_CHANGED } from '../building/service/update-building-negotiation-status.service'
import { AwilixContainer } from 'awilix'
import { EventBus } from '../infrastructure/event-bus'

export function setupEventListeners (container: AwilixContainer) {
  const eventBus = container.resolve('eventBus') as EventBus
  eventBus.on('meeting.created', container.resolve('removeCallsOnNewMeeting'))

  eventBus.on(BUILDING_NEGOTIATION_STATUS_CHANGED, container.resolve('removeScheduledCallsOnOwnerRefusal'))

  eventBus.on('virtual-caller.sms-received', container.resolve('scheduledCallFromOwnerMessage'))
}
