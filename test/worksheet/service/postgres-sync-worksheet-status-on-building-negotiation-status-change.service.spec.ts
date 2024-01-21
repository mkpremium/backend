import { createTestContainer } from '../../create-test-container'
import {
  SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
} from '../../../src/worksheet/service/sync-worksheet-status-on-building-negotiation-status-change.service'
import { expect } from 'chai'
import { AddContactService } from "../../../src/owner/service/add-contact.service";
import { AddOwnerService } from "../../../src/owner/service/add-owner.service";
import { AddOperatorService } from "../../../src/user/service/add-operator.service";
import { BuildingsRepository } from "../../../src/building/repository/buildings.repository";
import {
  PostgresWorksheetQueueRepository
} from "../../../src/worksheet/repository/postgres-worksheet-queue.repository";
import { PostgresWorksheetRepository } from "../../../src/worksheet/repository/postgres-worksheet.repository";
import { addCaller } from "../../helpers";
import { buildingFactory, worksheetFactory } from "../../factories";

describe('SyncWorksheetStatusOnBuildingNegotiationStatusChangeService', () => {
  it('updates worksheet status', async () => {
    const deps = await buildDependencies()
    const testCallerUser = await addCaller(deps)
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build());
    await deps.worksheetRepository.save(worksheetFactory.build({}, {buildingId: testBuilding.id}))

    expect(
      async () => await deps.syncWorksheetStatusOnBuildingNegotiationStatusChangeService.updateWorksheet(
        {buildingId: testBuilding.id, userId: testCallerUser.id})
    ).to.not.throw(Error)
  })
})

interface Deps {
  addContactService: AddContactService
  addOwnerService: AddOwnerService
  addOperatorService: AddOperatorService
  buildingsRepository: BuildingsRepository
  postgresQueueRepository: PostgresWorksheetQueueRepository
  syncWorksheetStatusOnBuildingNegotiationStatusChangeService: SyncWorksheetStatusOnBuildingNegotiationStatusChangeService
  worksheetRepository: PostgresWorksheetRepository
}

async function buildDependencies(): Promise<Deps> {
  const container = await createTestContainer({couchbase: false, postgres: true})

  return {
    addOwnerService: container.resolve('addOwnerService'),
    addContactService: container.resolve('addContactService'),
    addOperatorService: container.resolve('addOperatorService'),
    buildingsRepository: container.resolve('buildingsRepository'),
    postgresQueueRepository: container.resolve('postgresQueueRepository'),
    syncWorksheetStatusOnBuildingNegotiationStatusChangeService:
      container.resolve('syncWorksheetStatusOnBuildingNegotiationStatusChangeService'),
    worksheetRepository: container.resolve('worksheetRepository'),
  }
}
