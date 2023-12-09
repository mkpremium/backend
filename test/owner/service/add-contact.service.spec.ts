import { expect } from 'chai'
import { ownerBuilder } from '../owner.builder'
import { createTestContainer } from '../../create-test-container'
import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import uuid from 'uuid/v4'
import { Factory } from 'rosie'
import { ContactProps } from '../../../src/owner/owner'
import { AddContactService } from '../../../src/owner/service/add-contact.service'
import { DataSource } from 'typeorm'
import { createOwner } from '../../../src/owner/service/create-owner'

describe('Add Contact service', () => {
  let service: AddContactService
  let ownersRepository: OwnerRepository
  let dataSource: DataSource

  beforeEach(async () => {
    const diContainer = await createTestContainer({ couchbase: false, postgres: true })

    service = diContainer.resolve('addContactService')
    ownersRepository = diContainer.resolve('ownersRepository')
    dataSource = diContainer.resolve('ormDataSource')
  })

  it('adds contact to person', async () => {
    const [owner] = await createOwner(dataSource.manager, {
      status: 'NO_VERIFICADO',
      person: {
        name: 'Name',
        firstName: 'firstName',
        firstSurname: 'firstSurname'
      }
    })

    const contact = {
      ...Factory.build<ContactProps>('phone-contact'),
      isFeatured: true,
      ownerId: owner.id
    }
    const savedContact = await service.addContact(contact) as ContactProps

    expect(savedContact).to.deep.include({ value: contact.value, status: contact.status, isFeatured: true })
  })

})
