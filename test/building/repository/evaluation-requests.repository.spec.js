import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'

describe('EvaluationRequestsRepository', () => {
  let repository

  beforeEach(async () => {
    const container = await createTestContainer()
    repository = container.resolve('evaluationRequestsRepository')
  })

  it('works!', () => {
    expect(repository).to.not.be.undefined
  })
})
