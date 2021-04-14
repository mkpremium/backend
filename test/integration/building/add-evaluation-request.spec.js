import { createTestApp } from '../create-test-app'
import { expect } from 'chai'
import { ownerBuilder } from '../../owner/owner.builder'
import { Promise } from 'bluebird'

async function delayForConsistency () {
  await Promise.delay(100)
}

describe('AddEvaluationRequest', () => {
  let addEvaluationRequestService
  let ownersRepository

  before(async () => {
    const { locals: { diContainer } } = await createTestApp()
    addEvaluationRequestService = diContainer.resolve('addEvaluationRequestService')
    ownersRepository = diContainer.resolve('ownersRepository')
  })

  it('sets destination contact id as featured email', async () => {
    const testCmd = {
      ownerId: 'owner-id',
      destinationContactId: 'email-contact-id',
      reporterContactId: 'phone-reporter-contact-id',
      buildingId: 'building-id',
      flipperId: 'flipper-id',
      callerId: 'caller-id',
      worksheetId: 'worksheet-id'
    }

    await ownersRepository.save(ownerBuilder({ id: testCmd.ownerId }).withEmailContact(testCmd.destinationContactId).build())
    await addEvaluationRequestService.addEvaluationRequest(testCmd)

    await delayForConsistency()

    const owner = await ownersRepository.get(testCmd.ownerId)

    expect(owner.featuredContact.emailId).to.be.equal(testCmd.destinationContactId)
  })
})
