import { CallcenterView } from '../../../src/worksheet/repository/worksheet.repository'
import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'
import { worksheetBuilder } from '../worksheet.builder'
import { buildingBuilder } from '../../building/building.builder'
import { ownerBuilder } from '../../owner/owner.builder'

describe('worksheet.repository', () => {
  let repository, buildingsRepository, ownersRepository

  beforeEach(async () => {
    const container = await createTestContainer()
    repository = container.resolve('worksheetRepository')
    buildingsRepository = container.resolve('buildingsRepository')
    ownersRepository = container.resolve('ownersRepository')
  })

  it('gets worksheet with callcenter view', () => {
    const testWorksheetId = 'test-worksheet-id'
    const testBuilding = buildingBuilder().build()
    const testOwner = ownerBuilder({ buildingId: testBuilding.id }).build()
    const testWorksheet = worksheetBuilder({
      id: testWorksheetId,
      relatedBuildingIds: [ testBuilding.id ]
    }).build()

    return Promise.all([
      buildingsRepository.save(testBuilding),
      repository.save(testWorksheet),
      ownersRepository.save(testOwner)
    ]).then(() =>
      repository.getForCallcenterView(testWorksheetId)
        .then(result => {
          expect(() => CallcenterView(result)).not.throw
        })
    )
  })
})
