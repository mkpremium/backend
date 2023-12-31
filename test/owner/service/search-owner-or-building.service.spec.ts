import { createTestContainer } from '../../create-test-container'
import { buildingFactory } from '../../factories'
import type { SearchOwnerOrBuildingService } from '../../../src/owner/service/search-owner-or-building.service'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { AddOwnerService } from '../../../src/owner/service/add-owner.service'
import { createOwnerCmd } from '../../../src/test-harness/fake-data-generator'
import { expect } from 'chai'
import { WorksheetRepository } from '../../../src/worksheet/repository/worksheet.repository'
import { worksheetBuilder } from '../../worksheet/worksheet.builder'

describe('SearchOwnerOrBuildingService', () => {
  it('found owners with matching phone contact', async () => {
    const container = await createTestContainer({ couchbase: false, postgres: true })
    const buildingsRepository = container.resolve('buildingsRepository') as BuildingsRepository
    const worksheetsRepository = container.resolve('worksheetRepository') as WorksheetRepository
    const addOwnerService = container.resolve('addOwnerService') as AddOwnerService
    const testBuilding = await buildingsRepository.save(buildingFactory.build())
    await worksheetsRepository.save(worksheetBuilder({ relatedBuildingIds: [ testBuilding.id ] }).build())

    const addOwnerCommand = createOwnerCmd(testBuilding.id)
    await addOwnerService.addOwner(addOwnerCommand, 'test')

    const service = container.resolve('searchOwnerOrBuildingService') as SearchOwnerOrBuildingService
    const result = await service.search(addOwnerCommand.person.contacts[ 0 ].value)

    expect(result).to.have.lengthOf(1)
  })
})
