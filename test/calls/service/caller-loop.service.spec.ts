import { expect } from 'chai'
import { stub } from 'sinon'
import { CallerLoopService, StartLoopCommand } from '../../../src/calls/service/caller-loop.service'

const testCmd: StartLoopCommand = {
  queueId: 'test-queue-id',
  callerId: 'test-caller-id',
  contacts: function* () {
  },
}
describe.only('CallerLoopService', () => {
  let service!: CallerLoopService
  let takeNextWorksheetServiceStub

  beforeEach(() => {
    takeNextWorksheetServiceStub = {
      nextWorksheetInQueueOfId: stub().resolves(),
    }

    service = new CallerLoopService(
      takeNextWorksheetServiceStub,
    )
  })

  it('takes next worksheet from queue', async () => {
    await service.startLoop(testCmd)

    expect(takeNextWorksheetServiceStub.nextWorksheetInQueueOfId).to.have.been
      .calledWith(testCmd.queueId, testCmd.callerId)
  })
})
