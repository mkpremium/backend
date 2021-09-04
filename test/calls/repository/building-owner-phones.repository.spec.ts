import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'
import { BuildingOwnerPhonesRepository } from '../../../src/calls/repository/building-owner-phones.repository'
import { pipe } from 'fp-ts/function'
import { map, orElse } from 'fp-ts/TaskEither'
import { taskEither } from 'fp-ts'

describe('BuildingOwnerPhonesRepository', () => {
  let repository: BuildingOwnerPhonesRepository
  const testPhoneNumber = '+34666666666'

  beforeEach(async () => {
    const container = await createTestContainer()
    repository = container.resolve('buildingOwnerPhonesRepository')
  })

  it('creates repository', () => {
    expect(repository).to.be.ok
  })

  it('adds building owner phone from phone number', () => {
    const expectedId = `owner_phone_${testPhoneNumber}`

    return pipe(
      repository.add(testPhoneNumber),
      taskEither.chain(() => repository.getByPhoneNumberAndLock(testPhoneNumber)),
      taskEither.map(({ cas, ownerPhone }) => {
        expect(ownerPhone.id).to.be.equal(expectedId)
        expect(ownerPhone.phoneNumber).to.be.equal(testPhoneNumber)
        expect(ownerPhone.createdAt).to.be.instanceOf(Date)
        expect(ownerPhone.updatedAt).to.be.instanceOf(Date)
      }),
      taskEither.orLeft(expect.fail)
    )()
  })

  it.skip('creates building owner phone when it does not exist', () => {
    return pipe(
      repository.getByPhoneNumberAndLock(testPhoneNumber),
      map(result => {
        expect(result).to.have.keys([ 'ownerPhone', 'cas' ])
        expect(result.ownerPhone).to.have.keys([ 'phoneNumber', 'createdAt', 'updatedAt' ])
        expect(result.ownerPhone.phoneNumber).to.be.equal(testPhoneNumber)
        expect(result.ownerPhone.createdAt).to.be.not.undefined
        expect(result.ownerPhone.updatedAt).to.be.not.undefined
      }),
      orElse(expect.fail),
    )()
  })
})

