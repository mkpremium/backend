import couchbase from '../../../src/db/couchbase'
import { createAwilixContainer } from '../../../src/infrastructure/dependencies'
import { expect } from 'chai'
import { ownerBuilder } from '../owner.builder'
import { buildingBuilder } from '../../building/building.builder'
import { worksheetBuilder } from '../../worksheet/worksheet.builder'
import { Promise } from 'bluebird'

describe('OwnerRepository', () => {
  let repository
  let buildingsRepository
  let worksheetsRepository

  beforeEach(async () => {
    const couchbaseBucket = await couchbase()

    await couchbaseBucket.flushAsync()
    const diContainer = createAwilixContainer(couchbaseBucket, true)

    repository = diContainer.resolve('ownersRepository')
    buildingsRepository = diContainer.resolve('buildingsRepository')
    worksheetsRepository = diContainer.resolve('worksheetRepository')
  })

  it('finds owner by its id', async () => {
    const testBuilding = buildingBuilder().build()
    const testWorksheet = worksheetBuilder({ relatedBuildingIds: [ testBuilding.id ] }).build()
    const testOwner = ownerBuilder({ buildingId: testBuilding.id }).withPhoneContact().build()

    return Promise.all([
      repository.save(testOwner),
      buildingsRepository.save(testBuilding),
      worksheetsRepository.save(testWorksheet)
    ])
      .then(() => repository.findByPhoneNumber('666666666'))
      .then(result => {
        expect(result.length).to.be.equal(1)
      })
  })
})
