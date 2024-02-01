import { ScheduledCallsRepository } from '../repository/scheduled-calls.repository'
import { type EntityManager } from 'typeorm'
import { ScheduledEvent } from '../scheduled-event.entity'

const buildingStatusesThatCancelScheduledCalls = ['NO VENDE', 'DESCARTADO']

interface Deps {
  scheduledCallsRepository: ScheduledCallsRepository,
  usePostgres: boolean,
  entityManager: EntityManager
}

export function removeScheduledCallsOnOwnerRefusal ({ scheduledCallsRepository, usePostgres, entityManager }: Deps) {
  return async function ({ buildingId, negotiationStatus }) {
    if (!buildingStatusesThatCancelScheduledCalls.includes(negotiationStatus)) {
      return Promise.resolve()
    }

    if (usePostgres) {
      await entityManager.delete(ScheduledEvent, {
        building: { id: buildingId },
        type: 'CALLS'
      })
    } else {
      await scheduledCallsRepository.removeScheduledCallsForBuilding(buildingId)
    }
  }
}
