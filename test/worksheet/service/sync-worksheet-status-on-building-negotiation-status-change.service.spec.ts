import { createTestContainer } from '../../create-test-container'
import {
  SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
} from '../../../src/worksheet/service/sync-worksheet-status-on-building-negotiation-status-change.service'
import { userBuilder } from '../../user/user.builder'
import { buildingBuilder } from '../../building/building.builder'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { worksheetBuilder } from '../worksheet.builder'
import { WorksheetRepository } from '../../../src/worksheet/repository/worksheet.repository'
import { expect } from 'chai'

describe('SyncWorksheetStatusOnBuildingNegotiationStatusChangeService', () => {
  it('updates worksheet status', async () => {
    const container = await createTestContainer({ couchbase: true, postgres: false })
    const buildingsRepository = container.resolve('buildingsRepository') as BuildingsRepository
    const worksheetRepository = container.resolve('worksheetRepository') as WorksheetRepository
    const service = container.resolve('syncWorksheetStatusOnBuildingNegotiationStatusChangeService') as SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
    const testUser = userBuilder().build()
    const testBuilding = await buildingsRepository.save(buildingBuilder().build())
    await worksheetRepository.save(
      worksheetBuilder({ relatedBuildingIds: [ testBuilding.id ] }).build())

    expect(
      async () => await service.updateWorksheet({ buildingId: testBuilding.id, userId: testUser.id })
    ).to.not.throw(Error)
  })
})
