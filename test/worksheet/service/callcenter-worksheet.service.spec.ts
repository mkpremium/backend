import { CallcenterView } from '../../../src/worksheet/repository/worksheet.repository'
import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'
import { worksheetBuilder } from '../worksheet.builder'
import { buildingBuilder } from '../../building/building.builder'
import { validate } from 'tcomb-validation'
import uuid from 'uuid/v4'
import { CallcenterWorksheetService } from '../../../src/worksheet/service/callcenter-worksheet.service'
import { PostgresWorksheetRepository } from '../../../src/worksheet/repository/postgres-worksheet.repository'
import { AddContactService, MaybeFeaturedContact } from '../../../src/owner/service/add-contact.service'
import { AddProposalForBuildingService } from '../../../src/building/service/add-proposal-for-building.service'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { BuildingsReadRepository } from '../../../src/building/repository/buildings-read.repository'
import { AddFlipperService } from '../../../src/flipper/service/add-flipper.service'
import { Factory } from 'rosie'
import { AddOwnerService } from '../../../src/owner/service/add-owner.service'
import { addProposal, createOwnerWithEmailContact } from '../helpers'

describe('CallcenterWorksheetService', () => {
  it('gets worksheet with callcenter view', async () => {
    const {
      addContactService,
      addFlipperService,
      addOwnerService,
      addProposalForBuildingService,
      callcenterWorksheetService,
      worksheetRepository,
      buildingsRepository,
    } = await buildDependencies()

    const testWorksheetId = uuid()
    const testBuilding = await buildingsRepository.save(buildingBuilder({
      cadastre: {
        reference: 'test-cadastre-reference',
      },
    }).build())

    const [ testOwner, testEmailContact ] =
      await createOwnerWithEmailContact(testBuilding, addOwnerService, addContactService)
    const testFlipper = await addFlipperService.addFlipper(Factory.build('user'))

    await addProposal(testBuilding, testOwner, testEmailContact, testFlipper, addProposalForBuildingService)

    await worksheetRepository.save(worksheetBuilder({
        id: testWorksheetId,
        relatedBuildingIds: [ testBuilding.id ]
      }).build()
    )

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

  buildingsRepository: BuildingsRepository,
  buildingsReadRepository: BuildingsReadRepository,
  addFlipperService: AddFlipperService,
}> {
  const container = await createTestContainer({ couchbase: true, postgres: true })

  return {
    addContactService: container.resolve('addContactService'),
    addOwnerService: container.resolve('addOwnerService'),
    addProposalForBuildingService: container.resolve('addProposalForBuildingService'),

    callcenterWorksheetService: container.resolve('callcenterWorksheetService'),

    buildingsRepository: container.resolve('buildingsRepository'),
    addFlipperService: container.resolve('addFlipperService'),
    buildingsReadRepository: container.resolve('buildingsReadRepository'),
    worksheetRepository: container.resolve('worksheetRepository'),
  }
}
