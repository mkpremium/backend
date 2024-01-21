import { buildingFactory } from '../../factories'
import { createOwnerCmd } from '../../../src/test-harness/fake-data-generator'
import { expect } from 'chai'
import { worksheetBuilder } from '../../worksheet/worksheet.builder'
import { resolveDependencies } from "../../helpers";

describe('SearchOwnerOrBuildingService', () => {
  it('found owners with matching phone contact', async () => {
    const deps = await resolveDependencies()
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    await deps.worksheetRepository.save(worksheetBuilder({ relatedBuildingIds: [ testBuilding.id ] }).build())

    const addOwnerCommand = createOwnerCmd(testBuilding.id)
    await deps.addOwnerService.addOwner(addOwnerCommand, 'test')

    const result = await deps.searchOwnerOrBuildingService.search(addOwnerCommand.person.contacts[ 0 ].value)

    expect(result).to.have.lengthOf(1)
  })
})
