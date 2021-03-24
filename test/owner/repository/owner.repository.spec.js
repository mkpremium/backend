import { expect } from 'chai'
import { ownerBuilder } from '../owner.builder'
import { buildingBuilder } from '../../building/building.builder'
import { worksheetBuilder } from '../../worksheet/worksheet.builder'
import { createTestContainer } from '../../create-test-container'
import { validate } from 'tcomb-validation'
import { WorksheetBuilding } from '../../../src/worksheet/repository/worksheet.repository'

describe('OwnerRepository', () => {
  let repository
  let buildingsRepository
  let worksheetsRepository

  beforeEach(async () => {
    const diContainer = await createTestContainer()

    repository = diContainer.resolve('ownersRepository')
    buildingsRepository = diContainer.resolve('buildingsRepository')
    worksheetsRepository = diContainer.resolve('worksheetRepository')
  })

  it('finds owner by its phone contact', async function () {
    this.retries = 1
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
        expect(validate(result[ 0 ].building, WorksheetBuilding).errors).to.be.deep.equal([])
      })
  })
})
