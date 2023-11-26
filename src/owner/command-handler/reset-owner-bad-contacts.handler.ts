import { OwnerRepository } from '../repository/owner.repository'
import { Logger } from 'winston'
import { ChangeContactStatusService } from '../service/change-contact-status.service'
import _ from 'lodash'
import { isPhoneContact } from '../owner'

export function createResetOwnerBadContactsHandler ({ ownersRepository, logger, changeContactStatusService }: {
  ownersRepository: OwnerRepository,
  changeContactStatusService: ChangeContactStatusService,
  logger: Logger,
}) {
  return async function ({ ownerId }: { ownerId: string }) {
    logger.info('Command to reset owner discarded phones', { ownerId })
    let owner = await ownersRepository.get(ownerId)
    const contacts = _.get(owner, 'person.contacts', [])
    if (contacts.length === 0) {
      logger.warning('Owner without contacts', { ownerId })
      return
    }

    for (const contact of owner.person.contacts) {
      if (isPhoneContact(contact) && contact.status === 'BAD') {
        logger.info('Changing contact from BAD to UNDEFINED', { ownerId, contactId: contact.id })
        await changeContactStatusService.change(
          { ownerId, contactId: contact.id, status: 'UNDEFINED' }, { id: 'reset-owner-discarded-contact' })
      }
    }
  }
}
