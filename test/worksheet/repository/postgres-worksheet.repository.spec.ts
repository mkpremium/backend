import { CallcenterView } from '../../../src/worksheet/repository/worksheet.repository'
import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'
import { worksheetBuilder } from '../worksheet.builder'
import { buildingBuilder } from '../../building/building.builder'
import { ownerBuilder } from '../../owner/owner.builder'
import { validate } from 'tcomb-validation'
import { PostgresWorksheetRepository } from '../../../src/worksheet/repository/postgres-worksheet.repository'
import { PostgresBuildingsRepository } from '../../../src/building/repository/postgres-buildings.repository'
import { PostgresOwnersRepository } from '../../../src/owner/repository/postgres-owners.repository'
import uuid from 'uuid/v4'

describe('PostgresWorksheetRepository', () => {
  it('gets worksheet with callcenter view', async () => {
    const container = await createTestContainer({ postgres: true, couchbase: false })
    const repository: PostgresWorksheetRepository = container.resolve('worksheetRepository')
    const buildingsRepository: PostgresBuildingsRepository = container.resolve('buildingsRepository')
    const ownersRepository: PostgresOwnersRepository = container.resolve('ownersRepository')

    const testWorksheetId = uuid()
    const testBuilding = buildingBuilder({
      id: uuid(),
      cadastre: {
        reference: 'test-cadastre-reference',
      },
      // TODO: add proposal.
      // recentProposal: {
      //   id: 'test-proposal-id',
      //   buildingId: 'test-building-id',
      //   ownerId: 'test-owner-id',
      //   createdBy: 'test-created-by',
      //   createdAt: '2021-03-31T11:45:00.000Z',
      //   proposal: 100000
      // }
    }).build()

    const testOwner = ownerBuilder({ id: uuid(), buildingId: testBuilding.id }).build()
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
