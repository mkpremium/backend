import { expect } from 'chai'
import { ownerBuilder } from '../owner.builder'
import { createTestContainer } from '../../create-test-container'
import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import uuid from 'uuid/v4'
import { Factory } from 'rosie'
import { ContactProps } from '../../../src/owner/owner'
import { AddContactService } from '../../../src/owner/service/add-contact.service'

describe('OwnerRepository (Couchbase)', () => {
  let service: AddContactService
  let ownersRepository: OwnerRepository

  beforeEach(async () => {
    const diContainer = await createTestContainer({ couchbase: false, postgres: true })

    service = diContainer.resolve('addContactService')
    ownersRepository = diContainer.resolve('ownersRepository')
  })

  it('adds contact to person', async () => {
    const owner = await ownersRepository.save(ownerBuilder({ id: uuid() }).build())

    const contact = {
      ...Factory.build<ContactProps>('phone-contact'),
      isFeatured: true,
      ownerId: owner.id
    }
    const savedContact = await service.addContact(contact) as ContactProps

    expect(savedContact).to.deep.include({ value: contact.value, status: contact.status, isFeatured: true })
  })

})
