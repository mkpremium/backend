import { ChangeContactStatusService } from '../../../src/owner/service/change-contact-status.service'
import { createOwner, testPhoneContactId } from '../../../test-e2e/helper/mother-of-objects'
import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'
import { OwnerStatus } from '../../../src/owner/owner'

describe('ChangeContactStatusService(Couchbase)', () => {
  let service: ChangeContactStatusService
  let owner

  beforeEach(async () => {
    const container = await createTestContainer()
    owner = await createOwner(container, { status: undefined })

    service = container.resolve('changeContactStatusService')
  })

  it('marks owner as VERIFIED when at least one at least one contact is GOOD', async () => {
    expect(owner.status).to.be.equal(OwnerStatus.NON_VERIFIED)

    const updatedOwner = await service.change({
      ownerId: owner.id,
      contactId: testPhoneContactId,
      status: 'GOOD'
    }, {id: 'test-caller-id'})

    expect(updatedOwner.status).to.be.equal(OwnerStatus.VERIFIED)
  })

  it('marks owner as WITHOUT_CONTACT when all contacts are BAD', async () => {
    expect(owner.status).to.be.equal(OwnerStatus.NON_VERIFIED)

    const updatedOwner = await service.change({
      ownerId: owner.id,
      contactId: testPhoneContactId,
      status: 'BAD'
    }, {id: 'test-caller-id'})
    expect(updatedOwner.status).to.be.equal(OwnerStatus.WITHOUT_CONTACT)
  })
})
