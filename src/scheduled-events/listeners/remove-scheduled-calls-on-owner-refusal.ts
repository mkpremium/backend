import type { RemoveScheduledCallsService } from '../service/remove-scheduled-calls.service'

const buildingStatusesThatCancelScheduledCalls = ['NO VENDE', 'DESCARTADO']

interface Deps {
  removeScheduledCallsService: RemoveScheduledCallsService
}

export function removeScheduledCallsOnOwnerRefusal ({ removeScheduledCallsService }: Deps) {
  return async function ({ buildingId, negotiationStatus }) {
    if (!buildingStatusesThatCancelScheduledCalls.includes(negotiationStatus)) {
      return Promise.resolve()
    }
    await removeScheduledCallsService.removeScheduledCallsFor(buildingId)
  }
}
