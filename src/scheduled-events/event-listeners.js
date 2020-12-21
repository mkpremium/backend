import { BUILDING_NEGOTIATION_STATUS_CHANGED } from '../building/service/UpdateBuildingNegotiationStatusService'

export function setupEventListeners (eventBus, { scheduledCallRepository }) {
  eventBus.on('meeting.created', ({ buildingId }) => {
    return scheduledCallRepository.removeScheduledCallsForBuilding(buildingId)
  })

  eventBus.on(BUILDING_NEGOTIATION_STATUS_CHANGED, ({ buildingId, negotiationStatus }) => {
    if (negotiationStatus !== 'NO VENDE') {
      return Promise.resolve()
    }
    return scheduledCallRepository.removeScheduledCallsForBuilding(buildingId)
  })
}
