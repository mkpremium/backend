import { DataSource, EntityManager } from 'typeorm'
import { ContactProps, ContactType, isPhoneContact, OwnerContactStatus, OwnerProps } from '../owner'
import { Owner } from '../owner.entity'
import { Contact } from '../../contacts/contact.entity'
import { PersonContact } from '../person-contact.entity'
import { EventBus } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'

export interface AddContactCommand {
  ownerId: string
  isFeatured: boolean
  type: ContactType,
  value: string,
  status: OwnerContactStatus
}

export type MaybeFeaturedContact = ContactProps & { isFeatured: boolean }

export class AddContactService {
  private recording = []

  constructor (
    private ormDataSource: DataSource,
    private eventBus: EventBus
  ) {
  }

  async addContact (cmd: AddContactCommand): Promise<MaybeFeaturedContact | OwnerProps> {
    this.recording = []
    return await this.ormDataSource.transaction<MaybeFeaturedContact>(async entityManager => {
      const contact = await this.getOrCreateContact(entityManager, cmd)

      const owner = await this.getOwner(entityManager, cmd)
      const personToContactLink = await this.linkPersonToContact(entityManager, owner, contact, cmd)

      await this.eventBus.publish({
        name: DomainEventCatalog.OWNER__CONTACT_ADDED,
        version: '1',
        contactId: contact.id,
        ownerId: cmd.ownerId,
        recording: this.recording
      }, entityManager)

      return {
        id: contact.id,
        type: contact.type,
        value: contact.value,
        status: personToContactLink.status,
        isFeatured: owner.person.featuredPhoneContact === contact || owner.person.featuredEmailContact === contact
      }
    })
  }

  private async getOwner (entityManager: EntityManager, cmd: AddContactCommand) {
    return await entityManager.findOne(Owner, {
      where: {
        id: cmd.ownerId
      },
      relations: {
        person: true
      }
    })
  }

  private async getOrCreateContact (entityManager: EntityManager, cmd: AddContactCommand): Promise<Contact> {
    const contact = await entityManager.findOneBy(Contact, { value: cmd.value })
    if (contact) {
      this.recording.push({ type: 'contact_already_existed', contact_id: contact.id })
      return contact
    }

    return entityManager.save(Contact, {
      value: cmd.value,
      type: cmd.type
    })
  }

  private async linkPersonToContact (entityManager: EntityManager, owner: Owner, contact: Contact, cmd: AddContactCommand) {
    let personAndContactLink = await entityManager.findOneBy(PersonContact, {
      contact: { id: contact.id },
      person: { id: owner.person.id }
    })
    if (personAndContactLink) {
      this.recording.push({ type: 'person_contact_already_existed' })
      personAndContactLink.status = cmd.status
      await entityManager.save(personAndContactLink)
    } else {
      personAndContactLink = await entityManager.save(PersonContact, {
        person: owner.person,
        contact,
        status: cmd.status
      })
    }

    if (cmd.isFeatured) {
      if (isPhoneContact(cmd)) {
        owner.person.featuredPhoneContact = contact
      } else {
        owner.person.featuredEmailContact = contact
      }
      await entityManager.save(owner.person)
    }

    return personAndContactLink
  }
}
