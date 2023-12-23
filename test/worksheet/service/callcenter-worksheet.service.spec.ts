import { CallcenterView } from '../../../src/worksheet/repository/worksheet.repository'
import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'
import { worksheetBuilder } from '../worksheet.builder'
import { buildingBuilder } from '../../building/building.builder'
import { ownerBuilder } from '../../owner/owner.builder'
import { validate } from 'tcomb-validation'
import uuid from 'uuid/v4'
import { CallcenterWorksheetService } from '../../../src/worksheet/service/callcenter-worksheet.service'
import { PostgresWorksheetRepository } from '../../../src/worksheet/repository/postgres-worksheet.repository'
import { AddContactService } from '../../../src/owner/service/add-contact.service'
import { AddOwnerService } from '../../../src/owner/service/add-owner.service'
import { AddProposalForBuildingService } from '../../../src/building/service/add-proposal-for-building.service'
import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { BuildingsReadRepository } from '../../../src/building/repository/buildings-read.repository'
import { AddFlipperService } from '../../../src/flipper/service/add-flipper.service'

describe.skip('CallcenterWorksheetService', () => {
  it('gets worksheet with callcenter view', async () => {
    const {
      callcenterWorksheetService,
      worksheetRepository,
      buildingsRepository,
      ownersRepository,
    } = await buildDependencies()

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
      worksheetRepository.save(testWorksheet),
      ownersRepository.save(testOwner)
    ])

    const result = await callcenterWorksheetService.getWorksheetForCallcenterView(testWorksheetId)
    expect(validate(result, CallcenterView).errors).to.deep.equal([])
    // // TODO: assert owner
    expect(result.building.latestProposal).not.to.be.undefined
    expect(result.building.cadastreReference).to.be.equal('test-cadastre-reference')
  })
})

async function buildDependencies (): Promise<{
  addContactService: AddContactService,
  addOwnerService: AddOwnerService,
  addProposalForBuildingService: AddProposalForBuildingService,
  callcenterWorksheetService: CallcenterWorksheetService,
  worksheetRepository: PostgresWorksheetRepository,

  ownersRepository: OwnerRepository,
  buildingsRepository: BuildingsRepository,
  buildingsReadRepository: BuildingsReadRepository,
  addFlipperService: AddFlipperService,
}> {
  const container = await createTestContainer({ couchbase: true, postgres: true })

  return {
    addContactService: container.resolve('addContactService'),
    addProposalForBuildingService: container.resolve('addProposalForBuildingService'),
    addOwnerService: container.resolve('addOwnerService'),

    callcenterWorksheetService: container.resolve('callcenterWorksheetService'),

    ownersRepository: container.resolve('ownersRepository'),
    buildingsRepository: container.resolve('buildingsRepository'),
    addFlipperService: container.resolve('addFlipperService'),
    buildingsReadRepository: container.resolve('buildingsReadRepository'),
    worksheetRepository: container.resolve('worksheetRepository'),
  }
}
