import { expect } from 'chai'
import { ownerBuilder } from '../owner.builder'
import { buildingBuilder } from '../../building/building.builder'
import { createTestContainer } from '../../create-test-container'
import { validate } from 'tcomb-validation'
import { WorksheetBuilding } from '../../../src/worksheet/repository/worksheet.repository'
import { Promise as BluebirdPromise } from 'bluebird'
import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'

describe('OwnerRepository (Couchbase)', () => {
  let repository: OwnerRepository
  let buildingsRepository: BuildingsRepository

  beforeEach(async () => {
    const diContainer = await createTestContainer({ couchbase: false, postgres: true })

    repository = diContainer.resolve('ownersRepository')
  })

  it.skip('finds owner by its phone contact', async function () {
    const testBuilding = buildingBuilder().build()
    const testOwner = ownerBuilder({ buildingId: testBuilding.id }).withPhoneContact().build()

    return BluebirdPromise.all([
      repository.save(testOwner),
      buildingsRepository.save(testBuilding),
    ]).delay(100)
      .then(() => repository.findByPhoneNumber('666666666'))
      .then(result => {
        expect(result.length).to.be.equal(1)
        expect(validate(result[ 0 ].building, WorksheetBuilding).errors).to.be.deep.equal([])
      })
  })
})
