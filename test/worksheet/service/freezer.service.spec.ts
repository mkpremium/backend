import { createTestContainer } from "../../create-test-container";
import { CallcenterWorksheetService } from "../../../src/worksheet/service/callcenter-worksheet.service";
import { PostgresWorksheetRepository } from "../../../src/worksheet/repository/postgres-worksheet.repository";
import { BuildingsRepository } from "../../../src/building/repository/buildings.repository";
import { buildingFactory, worksheetFactory } from "../../factories";
import moment from "moment";
import { expect } from "chai";
import { FreezerService } from "../../../src/worksheet/service/freezer.service";

describe.skip('FreezerService', () => {
  it('makes available buildings in the freezer after the given number of days', async () => {
    const deps = await buildDependencies()

    const testDaysInFreezer = 90
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    const testWorksheet = await deps.worksheetRepository.save(worksheetFactory.build({
      statusChangedAt: moment().subtract(testDaysInFreezer, 'days').toDate(),
    }, {buildingId: testBuilding.id}))

    await expect(deps.callcenterWorksheetService.nextAvailableWorksheetInSource({province: testBuilding.address.province}))
      .to.be.rejectedWith(/Could not find any entity of type "Worksheet" matching/)

    await deps.freezerService.moveWorksheetOutOfFreezer(testDaysInFreezer, 500)

    await expect(deps.callcenterWorksheetService.nextAvailableWorksheetInSource({province: testBuilding.address.province}))
      .to.eventually.include({id: testWorksheet.id})
  })
})


interface Deps {
  buildingsRepository: BuildingsRepository,
  callcenterWorksheetService: CallcenterWorksheetService,
  freezerService: FreezerService,
  worksheetRepository: PostgresWorksheetRepository,
}

async function buildDependencies(): Promise<Deps> {
  const container = await createTestContainer({couchbase: false, postgres: true})

  return {
    buildingsRepository: container.resolve('buildingsRepository'),
    callcenterWorksheetService: container.resolve('callcenterWorksheetService'),
    freezerService: container.resolve('freezerService'),
    worksheetRepository: container.resolve('worksheetRepository'),
  }
}
