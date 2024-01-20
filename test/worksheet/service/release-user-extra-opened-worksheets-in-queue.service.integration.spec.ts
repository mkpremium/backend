import {
  ReleaseUserExtraOpenedWorksheetsInQueueService
} from '../../../src/worksheet/service/release-user-extra-opened-worksheets-in-queue.service'
import { expect } from 'chai'
import { BuildingsRepository } from "../../../src/building/repository/buildings.repository";
import {
  PostgresWorksheetQueueRepository
} from "../../../src/worksheet/repository/postgres-worksheet-queue.repository";
import { PostgresWorksheetRepository } from "../../../src/worksheet/repository/postgres-worksheet.repository";
import { createTestContainer } from "../../create-test-container";
import { buildingFactory, worksheetFactory, worksheetQueueFactory } from "../../factories";
import { addCaller } from "../../helpers";
import { AddOperatorService } from '../../../src/user/service/add-operator.service';
import moment from "moment";

describe('ReleaseUserOtherActiveWorksheetsInQueueService(Integration)', () => {
  it('releases oldest extra worksheet taken by user', async () => {
    const deps = await buildDependencies()
    const testQueue = await deps.postgresQueueRepository.save(worksheetQueueFactory.build())
    // A building only has one worksheet. We're reusing the same here to not slow down the test.
    const testCallerUser = await addCaller(deps)
    const test1HourAgoOpenedWorksheet = await deps.worksheetRepository.save(worksheetFactory.build({
      status: 'TAKEN',
      queueId: testQueue.id,
      viewedAt: moment().subtract(1, 'hour').toDate(),

    }, {buildingId: (await deps.buildingsRepository.save(buildingFactory.build())).id}))
    const test2HourAgoOpenedWorksheet = await deps.worksheetRepository.save(worksheetFactory.build({
      status: 'TAKEN',
      queueId: testQueue.id,
      viewedAt: moment().subtract(2, 'hours').toDate()
    }, {buildingId: (await deps.buildingsRepository.save(buildingFactory.build())).id}))
    const test3HourAgoOpenedWorksheet = await deps.worksheetRepository.save(worksheetFactory.build({
      status: 'TAKEN',
      queueId: testQueue.id,
      viewedAt: moment().subtract(3, 'hours').toDate()
    }, {buildingId: (await deps.buildingsRepository.save(buildingFactory.build())).id}))

    let refreshedTestQueue = await deps.postgresQueueRepository.get(testQueue.id)
    expect(refreshedTestQueue.worksheets).to.have.lengthOf(3)

    await deps.releaseUserOtherActiveWorksheetsInQueueService.release(testCallerUser.id, testQueue.id)

    refreshedTestQueue = await deps.postgresQueueRepository.get(testQueue.id)
    expect(refreshedTestQueue.worksheets).to.have.lengthOf(2)
    expect(refreshedTestQueue.worksheets[0]).to.include({worksheetId: test1HourAgoOpenedWorksheet})
    expect(refreshedTestQueue.worksheets[1]).to.include({worksheetId: test2HourAgoOpenedWorksheet})
  })
})

interface Deps {
  addOperatorService: AddOperatorService,
  buildingsRepository: BuildingsRepository,
  postgresQueueRepository: PostgresWorksheetQueueRepository,
  worksheetRepository: PostgresWorksheetRepository
  releaseUserOtherActiveWorksheetsInQueueService: ReleaseUserExtraOpenedWorksheetsInQueueService
}

async function buildDependencies(): Promise<Deps> {
  const container = await createTestContainer({couchbase: false, postgres: true})

  return {
    addOperatorService: container.resolve('addOperatorService'),
    buildingsRepository: container.resolve('buildingsRepository'),
    postgresQueueRepository: container.resolve('postgresQueueRepository'),
    worksheetRepository: container.resolve('worksheetRepository'),
    releaseUserOtherActiveWorksheetsInQueueService: container.resolve('releaseUserOtherActiveWorksheetsInQueueService'),
  }
}
