import { BUILDING_NEGOTIATION_STATUS_CHANGED } from '../building/service/update-building-negotiation-status.service'
import { logger } from '../infrastructure/logger'

const buildingStatusesThatCancelScheduledCalls = [ 'NO VENDE', 'DESCARTADO' ]

export function setupEventListeners (eventBus, { scheduledCallRepository }) {
  eventBus.on('meeting.created', ({ buildingId }) => {
    return scheduledCallRepository.removeScheduledCallsForBuilding(buildingId)
  })

  eventBus.on(BUILDING_NEGOTIATION_STATUS_CHANGED, ({ buildingId, negotiationStatus }) => {
    logger.info(
      'buildingStatusesThatCancelScheduledCalls.includes(negotiationStatus)',
      { included: buildingStatusesThatCancelScheduledCalls.includes(negotiationStatus), negotiationStatus }
    )
    if (!buildingStatusesThatCancelScheduledCalls.includes(negotiationStatus)) {
      return Promise.resolve()
    }
    return scheduledCallRepository.removeScheduledCallsForBuilding(buildingId)
  })
}
