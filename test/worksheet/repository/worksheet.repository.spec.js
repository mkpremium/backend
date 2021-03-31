import { CallcenterView } from '../../../src/worksheet/repository/worksheet.repository'
import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'
import { worksheetBuilder } from '../worksheet.builder'
import { buildingBuilder } from '../../building/building.builder'
import { ownerBuilder } from '../../owner/owner.builder'
import { validate } from 'tcomb-validation'

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
    const testBuilding = buildingBuilder({
      cadastre: {
        reference: 'test-cadastre-reference',
        address: 'test cadastre address'
      },
      recentProposal: {
        id: 'test-proposal-id',
        buildingId: 'test-building-id',
        createdBy: 'test-created-by',
        createdAt: '2021-03-31T11:45:00.000Z',
        proposal: 100000
      }
    }).build()
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
          expect(validate(result, CallcenterView).errors).to.deep.equal([])
          expect(result.building.latestProposal).not.to.be.undefined
          expect(result.building.cadastreReference).to.be.equal('test-cadastre-reference')
        })
    )
  })
})
