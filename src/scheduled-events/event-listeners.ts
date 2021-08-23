import { BUILDING_NEGOTIATION_STATUS_CHANGED } from '../building/service/update-building-negotiation-status.service'
import { AwilixContainer } from 'awilix'
import { ScheduledCallsRepository } from './repository/scheduled-calls.repository'
import { EventBus } from '../infrastructure/event-bus'

const buildingStatusesThatCancelScheduledCalls = [ 'NO VENDE', 'DESCARTADO' ]

export function setupEventListeners (container: AwilixContainer) {
  const eventBus = container.resolve('eventBus') as EventBus
  const scheduledCallRepository = container.resolve('scheduledCallsRepository') as ScheduledCallsRepository
  eventBus.on('meeting.created', ({ buildingId }) => {
    return scheduledCallRepository.removeScheduledCallsForBuilding(buildingId)
  })

  eventBus.on(BUILDING_NEGOTIATION_STATUS_CHANGED, ({ buildingId, negotiationStatus }) => {
    if (!buildingStatusesThatCancelScheduledCalls.includes(negotiationStatus)) {
      return Promise.resolve()
    }
    return scheduledCallRepository.removeScheduledCallsForBuilding(buildingId)
  })
}
