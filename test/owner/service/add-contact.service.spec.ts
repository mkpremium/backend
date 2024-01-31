import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'
import { Factory } from 'rosie'
import { ContactProps } from '../../../src/owner/owner'
import { AddContactService } from '../../../src/owner/service/add-contact.service'
import { DataSource } from 'typeorm'
import { createOwner } from '../../../src/owner/service/create-owner'
import { PersonContact } from '../../../src/owner/person-contact.entity'

describe('Add Contact service', () => {
  let service: AddContactService
  let dataSource: DataSource

  beforeEach(async () => {
    const diContainer = await createTestContainer({ couchbase: false, postgres: true })

    service = diContainer.resolve('addContactService')
    dataSource = diContainer.resolve('ormDataSource')
  })

  it('adds contact to person', async () => {
    const [firstOwner] = await createOwner(dataSource.manager, {
      status: 'NO_VERIFICADO',
      person: {
        name: 'First',
        firstName: 'Owner',
        firstSurname: 'firstSurname'
      }
    })

    const contact = {
      ...Factory.build<ContactProps>('phone-contact', { status: 'UNDEFINED' }),
      isFeatured: true,
      ownerId: firstOwner.id
    }
    const savedContact = await service.addContact(contact) as ContactProps

    expect(savedContact).to.deep.include({ value: contact.value, status: contact.status, isFeatured: true })

    // links existing contact to owner
    const [secondOwner] = await createOwner(dataSource.manager, {
      status: 'NO_VERIFICADO',
      person: {
        name: 'Second',
        firstName: 'Owner',
        firstSurname: 'firstSurname'
      }
    })

    await service.addContact({ ...contact, ownerId: secondOwner.id })

    const savedPersonContacts = await dataSource.manager.find(PersonContact, {
      where: { contact: { id: savedContact.id } },
      relations: { person: true },
      order: { createdAt: 'ASC' }
    })

    expect(savedPersonContacts).to.have.length(2)
    expect(savedPersonContacts.map(({ person }) => person.id)).to.deep.equal(
      [firstOwner.person.id, secondOwner.person.id])

    // update status when attempting to add an already existing contact
    const updatedContact = await service.addContact({ ...contact, status: 'GOOD' }) as ContactProps

    expect(updatedContact.id).to.be.equal(savedContact.id)
    expect(updatedContact.status).to.be.equal('GOOD')
  })
})
