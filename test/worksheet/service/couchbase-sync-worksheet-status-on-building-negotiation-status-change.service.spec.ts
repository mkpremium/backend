import { createTestContainer } from '../../create-test-container'
import {
  SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
} from '../../../src/worksheet/service/sync-worksheet-status-on-building-negotiation-status-change.service'
import { userBuilder } from '../../user/user.builder'
import { buildingBuilder } from '../../building/building.builder'
import { worksheetBuilder } from '../worksheet.builder'
import { expect } from 'chai'
import { CouchbaseBuildingsRepository } from '../../../src/building/repository/couchbase-building.repository'
import { CouchbaseWorksheetRepository } from '../../../src/worksheet/repository/couchbase-worksheet.repository'

describe('SyncWorksheetStatusOnBuildingNegotiationStatusChangeService', () => {
  it('updates worksheet status', async () => {
    const container = await createTestContainer({ couchbase: true, postgres: false })
    const buildingsRepository = container.resolve('couchbaseBuildingsRepository') as CouchbaseBuildingsRepository
    const worksheetRepository = container.resolve('couchbaseWorksheetRepository') as CouchbaseWorksheetRepository
    const service = container.resolve('syncWorksheetStatusOnBuildingNegotiationStatusChangeService') as SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
    const testUser = userBuilder().build()
    const testBuilding = await buildingsRepository.save(buildingBuilder().build())
    await worksheetRepository.save(
      worksheetBuilder({ relatedBuildingIds: [testBuilding.id] }).build())

    expect(
      async () => await service.updateWorksheet({ buildingId: testBuilding.id, userId: testUser.id })
    ).to.not.throw(Error)
  })
})
