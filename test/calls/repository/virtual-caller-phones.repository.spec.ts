import {
  LockedPhone,
  VirtualCallerPhonesRepository
} from '../../../src/calls/repository/virtual-caller-phones.repository'
import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'
import retry from 'bluebird-retry'

describe('VirtualCallerPhonesRepository', () => {
  let repository: VirtualCallerPhonesRepository
  const testPhoneNumber = '+34666666666'

  before(async () => {
    const container = await createTestContainer()

    repository = container.resolve('virtualCallerPhonesRepository')
  })

  it('locks and unlocks virtual caller phone', async () => {
    const before = new Date()
    const lockedPhone = await repository.lockPhone(testPhoneNumber)
    const after = new Date()

    await expect(lockedPhone.phone.lastLockAcquiredAt).to.be.within(before, after)
    await expect(repository.lockPhone(testPhoneNumber)).to.be.rejected

    await expect(repository.unlockPhone(testPhoneNumber, lockedPhone.cas)).to.be.fulfilled
  })

  it('saves phone with lock', async () => {
    const lockedPhone = await retry<LockedPhone>(
      () => repository.lockPhone(testPhoneNumber),
      {
        backoff: 2,
        max_tries: 10
      }
    )

    await repository.saveWithLock(lockedPhone)
  })
})
