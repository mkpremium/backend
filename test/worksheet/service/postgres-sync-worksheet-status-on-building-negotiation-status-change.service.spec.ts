import { createTestContainer } from '../../create-test-container'
import {
  SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
} from '../../../src/worksheet/service/sync-worksheet-status-on-building-negotiation-status-change.service'
import { expect } from 'chai'
import { AddOperatorService } from '../../../src/user/service/add-operator.service'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { PostgresWorksheetRepository } from '../../../src/worksheet/repository/postgres-worksheet.repository'
import { addCaller } from '../../helpers'
import { buildingFactory, worksheetFactory } from '../../factories'

describe('SyncWorksheetStatusOnBuildingNegotiationStatusChangeService(Postgres)', () => {
  it('updates worksheet status', async () => {
    const deps = await buildDependencies()
    const testCallerUser = await addCaller(deps)
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    await deps.worksheetRepository.save(worksheetFactory.build({}, { buildingId: testBuilding.id }))

    expect(
      async () => await deps.syncWorksheetStatusOnBuildingNegotiationStatusChangeService.updateWorksheet(
        { buildingId: testBuilding.id, userId: testCallerUser.id })
    ).to.not.throw(Error)
  })
})

interface Deps {
  addOperatorService: AddOperatorService
  buildingsRepository: BuildingsRepository
  syncWorksheetStatusOnBuildingNegotiationStatusChangeService: SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
  worksheetRepository: PostgresWorksheetRepository
}

async function buildDependencies (): Promise<Deps> {
  const container = await createTestContainer()

  return {
    addOperatorService: container.resolve('addOperatorService'),
    buildingsRepository: container.resolve('buildingsRepository'),
    syncWorksheetStatusOnBuildingNegotiationStatusChangeService:
      container.resolve('syncWorksheetStatusOnBuildingNegotiationStatusChangeService'),
    worksheetRepository: container.resolve('worksheetRepository')
  }
}
