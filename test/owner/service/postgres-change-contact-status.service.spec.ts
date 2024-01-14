import {ChangeContactStatusService} from '../../../src/owner/service/change-contact-status.service'
import {createTestContainer} from '../../create-test-container'
import {expect} from 'chai'
import {OwnerStatus} from '../../../src/owner/owner'
import {buildingFactory} from '../../factories'
import {BuildingsRepository} from '../../../src/building/repository/buildings.repository'
import {createOwnerWithPhoneContact} from '../../helpers'


describe('ChangeContactStatusService(Postgres)', () => {
  let service: ChangeContactStatusService
  let testOwner
  let testContact

  beforeEach(async () => {
    const container = await createTestContainer({postgres: true, couchbase: false})
    const buildingRepository: BuildingsRepository = await container.resolve('buildingsRepository')
    const testBuilding = await buildingRepository.save(buildingFactory.build())

    const [owner, phoneContact] = await createOwnerWithPhoneContact(testBuilding, {status: 'NO_VERIFICADO'}, {
      addOwnerService: container.resolve('addOwnerService'),
      addContactService: container.resolve('addContactService'),
    })

    testOwner = owner
    testContact = phoneContact

    service = container.resolve('changeContactStatusService')
  })

  it('marks owner as VERIFIED when at least one at least one contact is GOOD', async () => {
    expect(testOwner.status).to.be.equal(OwnerStatus.NON_VERIFIED)

    const updatedOwner = await service.change({
      ownerId: testOwner.id,
      contactId: testContact.id,
      status: 'GOOD'
    }, {id: 'test-caller-id'})

    expect(updatedOwner.status).to.be.equal(OwnerStatus.VERIFIED)
  })

  it('marks owner as WITHOUT_CONTACT when all contacts are BAD', async () => {
    expect(testOwner.status).to.not.equal(OwnerStatus.WITHOUT_CONTACT)

    const updatedOwner = await service.change({
      ownerId: testOwner.id,
      contactId: testContact.id,
      status: 'BAD'
    }, {id: 'test-caller-id'})
    expect(updatedOwner.status).to.be.equal(OwnerStatus.WITHOUT_CONTACT)
  })
})
