import { expect } from 'chai'
import { stub } from 'sinon'
import { CallDone } from '../../../src/calls/controller/call-done-webhook.controller'
import { createCallFinishedListener } from '../../../src/calls/event-listener/call-finished.listener'
import { virtualCallerBuilder } from '../virtual-caller.builder'

describe('call-finished.listener', () => {
  let listener: (evt: CallDone) => Promise<void>
  let virtualCallersRepositoryStub
  let virtualCallerSupervisorStub
  let virtualCallsRepositoryStub

  const testCallerPhoneNumber = '+34666666666'
  const testVirtualCaller = virtualCallerBuilder({ phoneNumber: testCallerPhoneNumber }).build()
  const testEvt: CallDone = {
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

  beforeEach(() => {
    virtualCallersRepositoryStub = {
      get: stub()
    }
    virtualCallerSupervisorStub = {
      check: stub().resolves(),
    }
    virtualCallsRepositoryStub = {
      savePhoneStatus: stub().resolves(),
    }

    listener = createCallFinishedListener({
      logger: { info: () => undefined },
      virtualCallerSupervisor: virtualCallerSupervisorStub,
      virtualCallersRepository: virtualCallersRepositoryStub,
      virtualCallsRepository: virtualCallsRepositoryStub
    })

    virtualCallersRepositoryStub.get.withArgs(testVirtualCaller.id).resolves(testVirtualCaller)
  })

  it('updates phone lock status', async () => {
    await listener(testEvt)

    expect(virtualCallsRepositoryStub.savePhoneStatus).to.have.been.calledWith(testCallerPhoneNumber, 'AVAILABLE')
  })

  it('notifies supervisor with virtual caller', async () => {
    await listener(testEvt)

    expect(virtualCallerSupervisorStub.check.lastCall.firstArg.caller).to.be.eq(testVirtualCaller)
  })
})
