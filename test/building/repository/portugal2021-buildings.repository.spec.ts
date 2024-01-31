import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'
import { Portugal2021BuildingsRepository } from '../../../src/building/repository/portugal2021-buildings.repository'
import { buildSourceBuilding } from '../service/portugal2021-source-building.builder'
import { pipe } from 'fp-ts/function'
import { orFail } from '../../helpers'
import { map } from 'fp-ts/TaskEither'
import { CouchbaseAdapter } from '../../../src/db/couchbase.adapter'

describe('Portugal2021BuildingsRepository', () => {
  let repository: Portugal2021BuildingsRepository
  let couchbaseAdapter: CouchbaseAdapter

  beforeEach(async () => {
    const container = await createTestContainer()
    repository = container.resolve('portugal2021BuildingsRepository')
    couchbaseAdapter = container.resolve('couchbaseAdapter')
  })

  it('gets pending buildings with slug', async () => {
    const testPendingBuilding = buildSourceBuilding({ id: 'test-pending-building', status: 'INBOX', slug: 'test-slug' })
    const testImportedBuilding = buildSourceBuilding({
      id: 'test-imported-building',
      status: 'BUILDING_IMPORTED',
      slug: 'test-slug'
    })

    await repository.save(testPendingBuilding)
    await repository.save(testImportedBuilding)

    return pipe(
      repository.pendingWithSlug('test-slug'),
      map(buildings => {
        expect(buildings).to.have.lengthOf(1)
        expect(buildings[0].id).to.be.equal(testPendingBuilding.id)
      }),
      orFail()
    )()
  })

  it('gets owners phone numbers', async () => {
    await couchbaseAdapter.upsert('dni-1', {
      id: 'dni-1',
      phones: ['666666666'],
      _documentType: 'portugal-2021-owner-phone'
    })
    await couchbaseAdapter.upsert('dni-2', {
      id: 'dni-2',
      phones: ['666666667'],
      _documentType: 'portugal-2021-owner-phone'
    })

    return pipe(
      repository.phoneNumbersFor(['dni-1', 'dni-2']),
      map((foundPhones) => {
        expect(foundPhones).to.have.deep.members([
          { id: 'dni-1', phones: ['666666666'] },
          { id: 'dni-2', phones: ['666666667'] }
        ])
      }),
      orFail()
    )()
  })
})
