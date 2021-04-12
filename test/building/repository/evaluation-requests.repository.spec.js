import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'

describe('EvaluationRequestsRepository', () => {
  let repository

  beforeEach(async () => {
    const container = await createTestContainer()
    repository = container.resolve('evaluationRequestsRepository')
  })

  it('adds evaluation request to scheduled-events', () => {
    const testEvaluationRequest = {
      ownerId: 'owner-id',
      destinationContactId: 'email-contact-id',
      reporterContactId: 'phone-reporter-contact-id',
      buildingId: 'building-id',
      flipperId: 'flipper-id',
      worksheetId: 'worksheet-id'
    }

    return repository.add(testEvaluationRequest)
      .then(() => {
        expect()
      })
  })
})
