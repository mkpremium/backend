import { OwnerContactStatusChanged } from '../../owner/service/change-contact-status.service'
import type { EntityManager } from 'typeorm'
import { ScheduledEvent } from '../scheduled-event.entity'

interface Deps {
  entityManager: EntityManager
}

export function removeScheduledCallOnDiscardedContact ({ entityManager }: Deps) {
  return async function ({ contactId, newContactStatus }: OwnerContactStatusChanged) {
    if (newContactStatus !== 'BAD') {
      return
    }
    await entityManager.delete(ScheduledEvent, {
      contact: { id: contactId },
      type: 'CALLS'
    })
  }
}
