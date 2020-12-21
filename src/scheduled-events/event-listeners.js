export function setupEventListeners (eventBus, { scheduledCallRepository }) {
  eventBus.on('meeting.created', ({ buildingId }) => {
    return scheduledCallRepository.removeScheduledCallsForBuilding(buildingId)
  })
}
