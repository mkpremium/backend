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
import { addCaller, createOwnerWithPhoneContact } from "../../helpers";
import { AddOperatorService } from '../../../src/user/service/add-operator.service';
import { TakeNextWorksheetService } from "../../../src/worksheet/service/take-next-worksheet.service";
import { AddContactService } from "../../../src/owner/service/add-contact.service";
import { AddOwnerService } from "../../../src/owner/service/add-owner.service";
import { WorksheetQueueProps } from "../../../src/worksheet/domain/queue";
import { UserProps } from "../../../src/types/user";

describe('Take and release worksheet', () => {
  it('releases oldest extra worksheet taken by user', async () => {
    const deps = await buildDependencies()
    const testQueue = await deps.postgresQueueRepository.save(worksheetQueueFactory.build())
    const testCallerUser = await addCaller(deps)
    const firstTakenWorksheet = await createAndTakeWorksheet(deps, testQueue, testCallerUser);
    const secondTakenWorksheet = await createAndTakeWorksheet(deps, testQueue, testCallerUser);
    const thirdTakenWorksheet = await createAndTakeWorksheet(deps, testQueue, testCallerUser);

    let refreshedTestQueue = await deps.postgresQueueRepository.get(testQueue.id)
    expect(refreshedTestQueue.worksheets).to.have.lengthOf(3)

    await deps.releaseUserOtherActiveWorksheetsInQueueService.release(testCallerUser.id, testQueue.id)

    refreshedTestQueue = await deps.postgresQueueRepository.get(testQueue.id)
    expect(refreshedTestQueue.worksheets).to.have.lengthOf(2)
    expect(refreshedTestQueue.worksheets.find(({worksheetId}) => worksheetId === firstTakenWorksheet.id)).to.be.undefined
    expect(refreshedTestQueue.worksheets.map(({worksheetId}) => worksheetId)).to.include.members([
      secondTakenWorksheet.id, thirdTakenWorksheet.id
    ])
  })
})

async function createAndTakeWorksheet(deps: Deps, testQueue: WorksheetQueueProps, testCallerUser: UserProps & {
  callerId?: string;
  flipperId?: string
}) {
  const testBuilding = await deps.buildingsRepository.save(buildingFactory.build());
  await createOwnerWithPhoneContact(testBuilding, deps)
  const testWorksheet = await deps.worksheetRepository.save(worksheetFactory.build({}, {buildingId: testBuilding.id}))
  await deps.takeNextWorksheetService.nextWorksheetInQueue(testQueue, testCallerUser.id)

  return testWorksheet
}

interface Deps {
  addContactService: AddContactService,
  addOwnerService: AddOwnerService,
  addOperatorService: AddOperatorService,
  buildingsRepository: BuildingsRepository
  postgresQueueRepository: PostgresWorksheetQueueRepository
  worksheetRepository: PostgresWorksheetRepository,
  releaseUserOtherActiveWorksheetsInQueueService: ReleaseUserExtraOpenedWorksheetsInQueueService
  takeNextWorksheetService: TakeNextWorksheetService
}

async function buildDependencies(): Promise<Deps> {
  const container = await createTestContainer({couchbase: false, postgres: true})

  return {
    addOwnerService: container.resolve('addOwnerService'),
    addContactService: container.resolve('addContactService'),
    addOperatorService: container.resolve('addOperatorService'),
    buildingsRepository: container.resolve('buildingsRepository'),
    postgresQueueRepository: container.resolve('postgresQueueRepository'),
    worksheetRepository: container.resolve('worksheetRepository'),
    releaseUserOtherActiveWorksheetsInQueueService: container.resolve('releaseUserOtherActiveWorksheetsInQueueService'),
    takeNextWorksheetService: container.resolve('takeNextWorksheetService'),
  }
}
