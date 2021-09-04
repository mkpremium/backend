import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'
import { BuildingOwnerPhonesRepository } from '../../../src/calls/repository/building-owner-phones.repository'
import { pipe } from 'fp-ts/function'
import { map } from 'fp-ts/TaskEither'
import { taskEither } from 'fp-ts'
import { CouchbaseAdapter } from '../../../src/db/couchbase.adapter'

describe('BuildingOwnerPhonesRepository', () => {
  let repository: BuildingOwnerPhonesRepository
  let couchbaseAdapter: CouchbaseAdapter
  let lastCas
  const testPhoneNumber = '+34666666666'
  const expectedId = `owner_phone_${testPhoneNumber}`

  beforeEach(async () => {
    const container = await createTestContainer()
    repository = container.resolve('buildingOwnerPhonesRepository')
    couchbaseAdapter = container.resolve('couchbaseAdapter')
    lastCas = undefined
  })

  afterEach(async () => {
    if (lastCas) {
      await couchbaseAdapter.unlock(expectedId, lastCas)
    }
  })

  it('creates repository', () => {
    expect(repository).to.be.ok
  })

  it('adds building owner phone from phone number', () => {
    return pipe(
      repository.add(testPhoneNumber),
      taskEither.chain(() => repository.getByPhoneNumberAndLock(testPhoneNumber)),
      taskEither.map(({ cas, ownerPhone }) => {
        lastCas = cas
        expect(ownerPhone.id).to.be.equal(expectedId)
        expect(ownerPhone.phoneNumber).to.be.equal(testPhoneNumber)
        expect(ownerPhone.createdAt).to.be.instanceOf(Date)
        expect(ownerPhone.updatedAt).to.be.instanceOf(Date)
      }),
      taskEither.orLeft(expect.fail)
    )()
  })

  it('creates building owner phone when it does not exist', () => {
    return pipe(
      repository.getByPhoneNumberAndLock(testPhoneNumber),
      map(result => {
        expect(result).to.have.keys([ 'ownerPhone', 'cas' ])
        lastCas = result.cas
      }),
      taskEither.orLeft(expect.fail),
    )()
  })

  it('saves changed building owner phone', () => {
    const testLastSmsSentId = 'test-last-sms-sent-id'
    let before

    return pipe(
      repository.add(testPhoneNumber),
      taskEither.chain((createdOwnerPhone) => {
        before = new Date()
        return repository.save({
          ...createdOwnerPhone,
          lastSmsSentId: testLastSmsSentId,
          lastSmsSentAt: new Date(),
        })
      }),
      taskEither.chain(() => repository.getByPhoneNumberAndLock(testPhoneNumber)),
      taskEither.map(({ cas, ownerPhone }) => {
        lastCas = cas
        expect(ownerPhone.id).to.be.equal(expectedId)
        expect(ownerPhone.lastSmsSentId).to.be.equal(testLastSmsSentId)
        expect(ownerPhone.lastSmsSentAt).to.be.instanceOf(Date)
        expect(ownerPhone.updatedAt).to.be.within(before, new Date())
      }),
      taskEither.orLeft(expect.fail)
    )()
  })
})

