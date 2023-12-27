import { CallcenterView } from '../../../src/worksheet/repository/worksheet.repository'
import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'
import { worksheetBuilder } from '../worksheet.builder'
import { buildingBuilder } from '../../building/building.builder'
import { validate } from 'tcomb-validation'
import { CallcenterWorksheetService } from '../../../src/worksheet/service/callcenter-worksheet.service'
import { PostgresWorksheetRepository } from '../../../src/worksheet/repository/postgres-worksheet.repository'
import { AddContactService } from '../../../src/owner/service/add-contact.service'
import { AddProposalForBuildingService } from '../../../src/building/service/add-proposal-for-building.service'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { BuildingsReadRepository } from '../../../src/building/repository/buildings-read.repository'
import { AddFlipperService } from '../../../src/flipper/service/add-flipper.service'
import { Factory } from 'rosie'
import { AddOwnerService } from '../../../src/owner/service/add-owner.service'
import { addProposal, createOwnerWithEmailContact } from '../../helpers'
import { buildingFactory } from '../../factories'

describe('CallcenterWorksheetService', () => {
  it('gets worksheet with callcenter view', async () => {
    const deps = await buildDependencies()

    const testBuilding = await deps.buildingsRepository.save(buildingBuilder({
      cadastre: {
        reference: 'test-cadastre-reference',
      },
    }).build())

    const [ testOwner, testEmailContact ] =
      await createOwnerWithEmailContact(testBuilding, deps)
    const testFlipper = await deps.addFlipperService.addFlipper(Factory.build('user'))

    await addProposal(testBuilding, testOwner, testEmailContact, testFlipper, deps.addProposalForBuildingService)

    const testWorksheet = await deps.worksheetRepository.save(worksheetBuilder({
        relatedBuildingIds: [ testBuilding.id ]
      }).build()
    )

    const result =
      await deps.callcenterWorksheetService.getWorksheetForCallcenterView(testWorksheet.id)
    expect(validate(result, CallcenterView).errors).to.deep.equal([])
    // // TODO: assert owner
    expect(result.building.latestProposal).not.to.be.undefined
    expect(result.building.cadastreReference).to.be.equal('test-cadastre-reference')
  })

  it('gets next available worksheet in source', async () => {
    const deps = await buildDependencies()

    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())

    await createOwnerWithEmailContact(testBuilding, deps)

    const testWorksheet = await deps.worksheetRepository.save(worksheetBuilder({
        relatedBuildingIds: [ testBuilding.id ]
      }).build())

    const nextWorksheet = await deps.callcenterWorksheetService.nextAvailableWorksheetInSource({province: testBuilding.address.province})

    expect(nextWorksheet.id).to.be.equal(testWorksheet.id)
  })
})

interface Deps {
  addContactService: AddContactService,
  addOwnerService: AddOwnerService,
  addProposalForBuildingService: AddProposalForBuildingService,
  callcenterWorksheetService: CallcenterWorksheetService,
  worksheetRepository: PostgresWorksheetRepository,

  buildingsRepository: BuildingsRepository,
  buildingsReadRepository: BuildingsReadRepository,
  addFlipperService: AddFlipperService,
}

async function buildDependencies (): Promise<Deps> {
  const container = await createTestContainer({ couchbase: false, postgres: true })

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
