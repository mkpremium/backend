import { CouchbaseOwnersRepository } from '../repository/couchbase-owners.repository'
import { DataSource, EntityManager } from 'typeorm'
import {
  ContactProps,
  ContactType,
  FeaturedContact,
  isPhoneContact,
  Owner as OwnerStruct,
  OwnerContactStatus,
  OwnerProps,
  Person as PersonStruct
} from '../owner'
import { Owner } from '../owner.entity'
import { Contact } from '../../contacts/contact.entity'
import { PersonContact } from '../person-contact.entity'
import { TypedContactInfo } from '../contact'
import t from 'tcomb'
import { EventBus } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'


export interface AddContactCmd {
  ownerId: string
  isFeatured: boolean
  type: ContactType,
  value: string,
  status: OwnerContactStatus
}

type MaybeFeaturedContact = ContactProps & { isFeatured: boolean }

export class AddContactService {
  constructor (
    private couchbaseOwnersRepository: CouchbaseOwnersRepository,
    private ormDataSource: DataSource,
    private usePostgres: boolean,
    private eventBus: EventBus,
  ) {
  }

  addContact (cmd: AddContactCmd): Promise<{ id: string }> {
    return this.usePostgres ? this.saveInPostgres(cmd) : this.saveInCouchbase(cmd)
  }

  private saveInPostgres (cmd: AddContactCmd): Promise<MaybeFeaturedContact> {
    return new Promise(async (resolve) => {
      await this.ormDataSource.transaction(async entityManager => {
        let recording = []
        const [ contact, contactRecording ] = await this.getOrCreateContact(entityManager, cmd)
        recording = recording.concat(contactRecording)

        const owner = await entityManager.findOne(Owner, {
          where: {
            id: cmd.ownerId
          },
          relations: {
            person: true
          }
        })
        const personToContactLink = await entityManager.save(PersonContact, {
          person: owner.person,
          contact,
          status: cmd.status,
        })
        if (cmd.isFeatured) {
          if (isPhoneContact(cmd)) {
            owner.person.featuredPhoneContact = contact
          } else {
            owner.person.featuredEmailContact = contact
          }
          await entityManager.save(owner.person)
        }

        resolve([
          {
            id: contact.id,
            type: contact.type,
            value: contact.value,
            status: personToContactLink.status,
            isFeatured: owner.person.featuredPhoneContact === contact || owner.person.featuredEmailContact === contact
          },
          recording
        ])
      })
    }).then(async ([ contact, recording ]) => {
      await this.eventBus.publish({
        name: DomainEventCatalog.OWNER__CONTACT_ADDED,
        version: '1',
        contactId: contact.id,
        ownerId: cmd.ownerId,
        recording,
      })

      return contact
    })
  }

  private async getOrCreateContact (entityManager: EntityManager, cmd: AddContactCmd): Promise<[ Contact, any[] ]> {
    const contact = await entityManager.findOneBy(Contact, { value: cmd.value })
    if (contact) {
      return [ contact, [ { type: 'contact_already_existed', contact_id: contact.id } ] ]
    }

    return [
      await entityManager.save(Contact, {
        value: cmd.value,
        type: cmd.type,
      }), []
    ]
  }

  private async saveInCouchbase (cmd: AddContactCmd): Promise<OwnerProps | MaybeFeaturedContact> {
    const owner = await this.couchbaseOwnersRepository.get(cmd.ownerId)
    let featuredContact = owner.featuredContact
    const newContact = TypedContactInfo(cmd as any)

    const { isFeatured } = cmd
    if (isFeatured) {
      featuredContact = FeaturedContact.update(featuredContact || FeaturedContact({}), {
        [ cmd.type === 'EMAIL' ? 'emailId' : 'phoneId' ]: {
          $set: newContact.id
        }
      })
    }

    const updatedOwner = OwnerStruct.update(owner, {
      featuredContact: { $set: featuredContact },
      $merge: {
        person: PersonStruct.update(owner.person, {
          $merge: {
            contacts: t.update(owner.person.contacts, {
              $push: [ newContact ]
            })
          }
        })
      }
    })

    return await this.couchbaseOwnersRepository.save(updatedOwner)
  }

}
