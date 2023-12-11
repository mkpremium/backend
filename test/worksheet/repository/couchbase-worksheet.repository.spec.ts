import { CallcenterView } from '../../../src/worksheet/repository/worksheet.repository'
import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'
import { worksheetBuilder } from '../worksheet.builder'
import { buildingBuilder } from '../../building/building.builder'
import { ownerBuilder } from '../../owner/owner.builder'
import { validate } from 'tcomb-validation'
import { CouchbaseWorksheetRepository } from '../../../src/worksheet/repository/couchbase-worksheet.repository'
import { CouchbaseBuildingsRepository } from '../../../src/building/repository/couchbase-building.repository'
import { CouchbaseOwnersRepository } from '../../../src/owner/repository/couchbase-owners.repository'

describe('CouchbaseWorksheetRepository', () => {
  it('gets worksheet with callcenter view', async () => {
    const container = await createTestContainer({ postgres: false, couchbase: true })
    const repository: CouchbaseWorksheetRepository = container.resolve('worksheetRepository')
    const buildingsRepository: CouchbaseBuildingsRepository = container.resolve('buildingsRepository')
    const ownersRepository: CouchbaseOwnersRepository = container.resolve('ownersRepository')

    const testWorksheetId = 'test-worksheet-id'
    const testBuilding = buildingBuilder({
      cadastre: {
        reference: 'test-cadastre-reference',
      },
      recentProposal: {
        id: 'test-proposal-id',
        buildingId: 'test-building-id',
        ownerId: 'test-owner-id',
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

    await Promise.all([
      buildingsRepository.save(testBuilding),
      repository.save(testWorksheet),
      ownersRepository.save(testOwner)
    ])

    const result = await repository.getForCallcenterView(testWorksheetId)
    expect(validate(result, CallcenterView).errors).to.deep.equal([])
    expect(result.building.latestProposal).not.to.be.undefined
    expect(result.building.cadastreReference).to.be.equal('test-cadastre-reference')
  })
})
