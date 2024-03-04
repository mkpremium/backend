import { expect } from 'chai'
import { buildingFactory, worksheetFactory, worksheetQueueFactory } from '../../factories'
import { addCaller, createOwnerWithPhoneContact, ResolvedDeps, resolveDependencies } from '../../helpers'
import { WorksheetQueueProps } from '../../../src/worksheet/domain/queue'
import { UserProps } from '../../../src/types/user'

describe('Take and release worksheet', () => {
  it('releases oldest extra worksheet taken by user', async () => {
    const deps = await resolveDependencies()
    const testQueue = await deps.postgresQueueRepository.save(worksheetQueueFactory.build())
    const testCallerUser = await addCaller(deps)
    const firstTakenWorksheet = await createAndTakeWorksheet(deps, testQueue, testCallerUser)
    const secondTakenWorksheet = await createAndTakeWorksheet(deps, testQueue, testCallerUser)
    const thirdTakenWorksheet = await createAndTakeWorksheet(deps, testQueue, testCallerUser)

    let refreshedTestQueue = await deps.postgresQueueRepository.get(testQueue.id)
    expect(refreshedTestQueue.worksheets).to.have.lengthOf(3)

    await deps.releaseUserOtherActiveWorksheetsInQueueService.release(testCallerUser.callerId, testQueue.id)

    refreshedTestQueue = await deps.postgresQueueRepository.get(testQueue.id)
    expect(refreshedTestQueue.worksheets).to.have.lengthOf(2)
    expect(refreshedTestQueue.worksheets.find(({ worksheetId }) => worksheetId === firstTakenWorksheet.id)).to.be.undefined
    expect(refreshedTestQueue.worksheets.map(({ worksheetId }) => worksheetId)).to.include.members([
      secondTakenWorksheet.id, thirdTakenWorksheet.id
    ])
  })
})

async function createAndTakeWorksheet (deps: ResolvedDeps, testQueue: WorksheetQueueProps, testCallerUser: UserProps & {
  callerId?: string;
  flipperId?: string
}) {
  const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
  await createOwnerWithPhoneContact(testBuilding, deps)
  const testWorksheet = await deps.worksheetRepository.save(worksheetFactory.build({}, { buildingId: testBuilding.id }))
  await deps.takeNextWorksheetService.nextWorksheetInQueue(testQueue, testCallerUser.id)

  return testWorksheet
}
