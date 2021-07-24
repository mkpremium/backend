import { expect } from 'chai'
import { stub } from 'sinon'
import { virtualCallerBuilder } from '../virtual-caller.builder'
import { WorksheetDone } from '../../../src/calls/service/virtual-caller.service'
import { createWorksheetDoneListener } from '../../../src/calls/event-listener/worksheet-done.listener'

describe('worksheet-done.listener', () => {
  let listener: (evt: WorksheetDone) => Promise<void>
  let virtualCallersRepositoryStub
  let virtualCallerSupervisorStub

  beforeEach(() => {
    virtualCallersRepositoryStub = {
      get: stub()
    }
    virtualCallerSupervisorStub = {
      check: stub().resolves(),
    }
    listener = createWorksheetDoneListener({
      logger: { info: () => undefined },
      virtualCallerSupervisor: virtualCallerSupervisorStub,
      virtualCallersRepository: virtualCallersRepositoryStub
    })
  })

  it('notifies supervisor with virtual caller', async () => {
    const testVirtualCaller = virtualCallerBuilder().build()
    virtualCallersRepositoryStub.get.withArgs(testVirtualCaller.id).resolves(testVirtualCaller)

    let testEvt: WorksheetDone = {
      name: 'virtual-caller.worksheet_done',
      callerId: testVirtualCaller.id,
      worksheetId: ''
    }
    await listener(testEvt)

    expect(virtualCallerSupervisorStub.check.lastCall.firstArg.caller).to.be.eq(testVirtualCaller)
  })
})
