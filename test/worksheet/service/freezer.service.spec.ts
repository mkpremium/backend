import { createTestContainer } from "../../create-test-container";
import { CallcenterWorksheetService } from "../../../src/worksheet/service/callcenter-worksheet.service";
import { PostgresWorksheetRepository } from "../../../src/worksheet/repository/postgres-worksheet.repository";
import { BuildingsRepository } from "../../../src/building/repository/buildings.repository";
import { buildingFactory, worksheetFactory, worksheetQueueFactory } from "../../factories";
import moment from "moment";
import { expect } from "chai";
import { FreezerService } from "../../../src/worksheet/service/freezer.service";
import { createOwnerWithPhoneContact } from "../../helpers";
import { AddOwnerService } from "../../../src/owner/service/add-owner.service";
import { AddContactService } from "../../../src/owner/service/add-contact.service";
import {
  PostgresWorksheetQueueRepository
} from "../../../src/worksheet/repository/postgres-worksheet-queue.repository";

describe.skip('FreezerService', () => {
  it('makes available buildings in the freezer after the given number of days', async () => {
    const deps = await buildDependencies()

    const testDaysInFreezer = 90
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    const testWorksheetQueue = await deps.postgresQueueRepository.save(worksheetQueueFactory.build())
    const testWorksheet = await deps.worksheetRepository.save(worksheetFactory.build({
      statusChangedAt: moment().subtract(testDaysInFreezer, 'days').toDate(),
      queueId: testWorksheetQueue.id,
    }, {buildingId: testBuilding.id}))
    await createOwnerWithPhoneContact(testBuilding, deps)

    await expect(deps.callcenterWorksheetService.nextAvailableWorksheetInSource({province: testBuilding.address.province}))
      .to.be.rejectedWith(/Could not find any entity of type "Worksheet" matching/)

    await deps.freezerService.moveWorksheetOutOfFreezer(testDaysInFreezer, 500)

    await expect(deps.callcenterWorksheetService.nextAvailableWorksheetInSource({province: testBuilding.address.province}))
      .to.eventually.include({id: testWorksheet.id})
  })
})


interface Deps {
  addContactService: AddContactService,
  addOwnerService: AddOwnerService,
  buildingsRepository: BuildingsRepository,
  callcenterWorksheetService: CallcenterWorksheetService,
  freezerService: FreezerService,
  postgresQueueRepository: PostgresWorksheetQueueRepository,
  worksheetRepository: PostgresWorksheetRepository,
}

async function buildDependencies(): Promise<Deps> {
  const container = await createTestContainer({couchbase: false, postgres: true})

  return {
    addContactService: container.resolve('addContactService'),
    addOwnerService: container.resolve('addOwnerService'),
    buildingsRepository: container.resolve('buildingsRepository'),
    callcenterWorksheetService: container.resolve('callcenterWorksheetService'),
    freezerService: container.resolve('freezerService'),
    postgresQueueRepository: container.resolve('postgresQueueRepository'),
    worksheetRepository: container.resolve('worksheetRepository'),
  }
}
