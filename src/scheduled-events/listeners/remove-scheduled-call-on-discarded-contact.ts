import { OwnerContactStatusChanged } from '../../owner/service/change-contact-status.service'
import { ScheduledCallsRepository } from '../repository/scheduled-calls.repository'
import type { EntityManager } from 'typeorm'
import { ScheduledEvent } from '../scheduled-event.entity'

interface Deps {
  scheduledCallsRepository: ScheduledCallsRepository
  usePostgres: boolean
  entityManager: EntityManager
}

export function removeScheduledCallOnDiscardedContact ({ entityManager, scheduledCallsRepository, usePostgres }: Deps) {
  return async function ({ contactId, newContactStatus }: OwnerContactStatusChanged) {
    if (newContactStatus !== 'BAD') {
      return
    }
    if (usePostgres) {
      await entityManager.delete(ScheduledEvent, {
        contact: { id: contactId },
        type: 'CALLS'
      })
    } else {
      await scheduledCallsRepository.removeScheduledCallsForContact(contactId)
    }
  }
}
