import { buildingBuilder } from '../../building/building.builder'
import { worksheetBuilder } from '../../worksheet/worksheet.builder'
import { createTestApp } from '../create-test-app'
import { expect } from 'chai'
import { ownerBuilder } from '../../owner/owner.builder'
import { Promise } from 'bluebird'

async function delayForConsistency () {
  await Promise.delay(500)
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
  let buildingsRepository
  let worksheetRepository

  before(async () => {
    const { locals: { diContainer } } = await createTestApp()
    addOfferRequestService = diContainer.resolve('addOfferRequestService')
    ownersRepository = diContainer.resolve('ownersRepository')
    buildingsRepository = diContainer.resolve('buildingsRepository')
    buildingNotesRepository = diContainer.resolve('buildingNotesRepository')
    worksheetRepository = diContainer.resolve('worksheetRepository')

    await ownersRepository.save(ownerBuilder({ id: testCmd.ownerId })
      .withEmailContact(testCmd.destinationContactId)
      .withPhoneContact(testCmd.reporterContactId)
      .build()
    )
    await buildingsRepository.save(buildingBuilder({ id: testCmd.buildingId }).build())
    await worksheetRepository.save(worksheetBuilder({id: testCmd.worksheetId}).build())
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

  it('sets owner as featured for building', async () => {
    const building = await buildingsRepository.get(testCmd.buildingId)

    expect(building.ownerId).to.be.equal(testCmd.ownerId)
  })

  it('add request as last meeting in worksheet', async () => {
    const worksheet = await worksheetRepository.get(testCmd.worksheetId)

    expect(worksheet.lastAddedMeeting).to.not.be.null
  })
})
