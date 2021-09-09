import { ScheduledCallsRepository } from '../repository/scheduled-calls.repository'

const buildingStatusesThatCancelScheduledCalls = [ 'NO VENDE', 'DESCARTADO' ]

interface Deps {
  scheduledCallsRepository: ScheduledCallsRepository
}

export function removeScheduledCallsOnOwnerRefusal ({ scheduledCallsRepository }: Deps) {
  return function ({ buildingId, negotiationStatus }) {
    if (!buildingStatusesThatCancelScheduledCalls.includes(negotiationStatus)) {
      return Promise.resolve()
    }

    return scheduledCallsRepository.removeScheduledCallsForBuilding(buildingId)
  }
}
