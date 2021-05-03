import { createTestApp } from '../create-test-app'
import { expect } from 'chai'
import { ownerBuilder } from '../../owner/owner.builder'
import { Promise } from 'bluebird'

async function delayForConsistency () {
  await Promise.delay(100)
}

describe('AddOfferRequest', () => {
  const testCmd = {
    ownerId: 'owner-id',
    destinationContactId: 'email-contact-id',
    reporterContactId: 'phone-reporter-contact-id',
    buildingId: 'building-id',
    flipperId: 'flipper-id',
    callerId: 'caller-id',
    worksheetId: 'worksheet-id',
    note: 'test note'
  }

  let addOfferRequestService
  let ownersRepository
  let buildingNotesRepository

  before(async () => {
    const { locals: { diContainer } } = await createTestApp()
    addOfferRequestService = diContainer.resolve('addOfferRequestService')
    ownersRepository = diContainer.resolve('ownersRepository')
    buildingNotesRepository = diContainer.resolve('buildingNotesRepository')

    await ownersRepository.save(ownerBuilder({ id: testCmd.ownerId })
      .withEmailContact(testCmd.destinationContactId)
      .withPhoneContact(testCmd.reporterContactId)
      .build()
    )
    await addOfferRequestService.addOfferRequest(testCmd)

    await delayForConsistency()
  })

  it('sets destination contact id as featured email', async () => {
    const owner = await ownersRepository.get(testCmd.ownerId)

    expect(owner.featuredContact.phoneId).to.be.equal(testCmd.reporterContactId)
  })

  it('adds note to building', async () => {
    const notes = await buildingNotesRepository.forBuildingOfId(testCmd.buildingId)

    expect(notes).to.be.lengthOf(1)
    expect(notes[ 0 ].note).to.be.equal(testCmd.note)
  })
})
