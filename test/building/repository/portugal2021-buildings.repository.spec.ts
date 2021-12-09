import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'
import { Portugal2021BuildingsRepository } from '../../../src/building/repository/portugal2021-buildings.repository'
import { buildSourceBuilding } from '../service/portugal2021-source-building.builder'
import { pipe } from 'fp-ts/function'
import { orFail } from '../../helpers'
import { map } from 'fp-ts/TaskEither'

describe.only('Portugal2021BuildingsRepository', () => {
  let repository: Portugal2021BuildingsRepository

  beforeEach(async () => {
    const container = await createTestContainer()
    repository = container.resolve('portugal2021BuildingsRepository')
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
        expect(buildings[ 0 ].id).to.be.equal(testPendingBuilding.id)
      }),
      orFail(),
    )()
  })
})

