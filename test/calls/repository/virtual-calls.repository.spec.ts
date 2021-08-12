import { expect } from 'chai'
import { VirtualCallsRepository } from '../../../src/calls/repository/virtual-calls.repository'
import { createTestContainer } from '../../create-test-container'

describe('VirtualCallsRepository', () => {
  let repository: VirtualCallsRepository

  beforeEach(async () => {
    repository = (await createTestContainer()).resolve('virtualCallsRepository')
  })

  it('works', async () => {
    expect(repository).to.be.ok
  })
})
