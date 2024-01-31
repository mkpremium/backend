import { CallcenterView } from '../../../src/worksheet/repository/worksheet.repository'
import { expect } from 'chai'
import { worksheetBuilder } from '../worksheet.builder'
import { buildingBuilder } from '../../building/building.builder'
import { validate } from 'tcomb-validation'
import { Factory } from 'rosie'
import { addProposal, createOwnerWithEmailContact, resolveDependencies } from '../../helpers'
import { buildingFactory } from '../../factories'
import type { MaybeFeaturedContact } from '../../../src/owner/service/add-contact.service'

describe('CallcenterWorksheetService', () => {
  it('gets worksheet with callcenter view', async () => {
    const deps = await resolveDependencies()

    const testBuilding = await deps.buildingsRepository.save(buildingBuilder({
      cadastre: {
        reference: 'test-cadastre-reference'
      }
    }).build())

    const [testOwner, testEmailContact] =
      await createOwnerWithEmailContact(testBuilding, deps)
    const testFlipper = await deps.addFlipperService.addFlipper(Factory.build('user'))

    await addProposal(testBuilding, testOwner, testEmailContact, testFlipper, deps)

    const testWorksheet = await deps.worksheetRepository.save(worksheetBuilder({
      relatedBuildingIds: [testBuilding.id]
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
    const deps = await resolveDependencies()

    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())

    const result = await createOwnerWithEmailContact(testBuilding, deps)
    const testEmailContact = result.pop() as MaybeFeaturedContact

    const testWorksheet = await deps.worksheetRepository.save(worksheetBuilder({
      relatedBuildingIds: [testBuilding.id]
    }).build())

    const nextWorksheet = await deps.callcenterWorksheetService.nextAvailableWorksheetInSource({ province: testBuilding.address.province })

    expect(nextWorksheet.id).to.be.equal(testWorksheet.id)
    expect(nextWorksheet.relatedOwners[0].person.contacts[0].value).to.be.equal(testEmailContact.value)
  })
})
