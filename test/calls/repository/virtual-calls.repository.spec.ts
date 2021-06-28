import { expect } from 'chai'
import { VirtualCallsRepository } from '../../../src/calls/repository/virtual-calls.repository'
import { createTestContainer } from '../../create-test-container'

describe('VirtualCallsRepository', () => {
  let repository: VirtualCallsRepository

  const testPhoneNumber = '+34666666666'

  beforeEach(async () => {
    repository = (await createTestContainer()).resolve('virtualCallsRepository')
  })

  it('creates lock object for phone number', async () => {
    const lock = await repository.lockPhone(testPhoneNumber)

    await expect(repository.lockPhone(testPhoneNumber)).to.be.rejected

    await repository.unlockPhone(testPhoneNumber, lock)

    await expect(repository.lockPhone(testPhoneNumber)
      .then(lock => repository.unlockPhone(testPhoneNumber, lock))).to.be.fulfilled
  })
})
