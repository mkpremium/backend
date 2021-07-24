import { expect } from 'chai'
import { stub } from 'sinon'
import { CallDone } from '../../../src/calls/controller/call-done-webhook.controller'
import { createCallFinishedListener } from '../../../src/calls/event-listener/call-finished.listener'
import { virtualCallerBuilder } from '../virtual-caller.builder'

describe('call-finished.listener', () => {
  let listener: (evt: CallDone) => Promise<void>
  let virtualCallersRepositoryStub
  let virtualCallerSupervisorStub

  beforeEach(() => {
    virtualCallersRepositoryStub = {
      get: stub()
    }
    virtualCallerSupervisorStub = {
      check: stub().resolves(),
    }
    listener = createCallFinishedListener({
      logger: { info: () => undefined },
      virtualCallerSupervisor: virtualCallerSupervisorStub,
      virtualCallersRepository: virtualCallersRepositoryStub,
    })
  })

  it('notifies supervisor with virtual caller', async () => {
    const testVirtualCaller = virtualCallerBuilder().build()
    virtualCallersRepositoryStub.get.withArgs(testVirtualCaller.id).resolves(testVirtualCaller)

    let testEvt: CallDone = {
      name: 'virtual-caller.call_finished',
      status: 'DONE',
      callerId: testVirtualCaller.id,
      callId: '',
      contactId: '',
      ownerId: '',
      ownerResponse: '',
      phoneNumber: '',
      worksheetId: ''
    }
    await listener(testEvt)

    expect(virtualCallerSupervisorStub.check.lastCall.firstArg.caller).to.be.eq(testVirtualCaller)
  })
})
