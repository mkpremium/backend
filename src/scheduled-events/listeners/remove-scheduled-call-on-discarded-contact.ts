import { OwnerContactStatusChanged } from '../../owner/service/change-contact-status.service'
import { ScheduledCallsRepository } from '../repository/scheduled-calls.repository'

export function removeScheduledCallOnDiscardedContact ({ scheduledCallsRepository }: { scheduledCallsRepository: ScheduledCallsRepository }) {
  return async function ({ contactId, newContactStatus }: OwnerContactStatusChanged) {
    if (newContactStatus !== 'BAD') {
      return
    }
    await scheduledCallsRepository.removeScheduledCallsForContact(contactId)
  }
}
