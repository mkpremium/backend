import { expect } from 'chai'
import { stub } from 'sinon'
import { virtualCallerBuilder } from '../virtual-caller.builder'
import { CallerPhone } from '../../../src/calls/domain/caller.phone'
import { continueVirtualCallerLoop } from '../../../src/calls/event-listener/continue-virtual-caller-loop'
import { CallDone } from '../../../src/calls/service/call-finished.processor'
import { createLoggerMock } from '../../infrastructure/logger.spec'

describe('call-finished.listener', () => {
  let listener: (evt: CallDone) => Promise<void>
  let virtualCallersRepositoryStub
  let virtualCallerSupervisorStub
  let virtualCallerPhonesRepositoryStub

  const testCallerPhoneNumber = '+34666666666'
  const testVirtualCaller = virtualCallerBuilder({ phoneNumber: testCallerPhoneNumber }).build()
  const testEvt: CallDone = {
    name: 'virtual_caller.call_finished',
    status: 'DONE',
    callerId: testVirtualCaller.id,
    callId: '',
    contactId: '',
    ownerId: '',
    ownerResponse: '',
    phoneNumber: '',
    worksheetId: ''
  }
  const testBusyLockedPhone = {
    phone: CallerPhone({
      id: `phone_${testCallerPhoneNumber}`,
      status: 'BUSY'
    } as any),
    cas: 'test-cas-lock'
  }


  beforeEach(() => {
    virtualCallersRepositoryStub = {
      get: stub()
    }
    virtualCallerSupervisorStub = {
      check: stub().resolves(),
    }
    virtualCallerPhonesRepositoryStub = {
      lockPhone: stub().resolves(testBusyLockedPhone),
      saveWithLock: stub(),
    }

    listener = continueVirtualCallerLoop({
      logger: createLoggerMock(),
      virtualCallerSupervisor: virtualCallerSupervisorStub,
      virtualCallersRepository: virtualCallersRepositoryStub,
      virtualCallerPhonesRepository: virtualCallerPhonesRepositoryStub
    })

    virtualCallersRepositoryStub.get.withArgs(testVirtualCaller.id).resolves(testVirtualCaller)
  })

  it('makes phone available', async () => {
    await listener(testEvt)

    expect(virtualCallerPhonesRepositoryStub.saveWithLock)
      .to.have.been.called
    expect(virtualCallerPhonesRepositoryStub.saveWithLock.lastCall.firstArg.phone.status)
      .to.be.equal('AVAILABLE')
  })

  it('notifies supervisor with virtual caller', async () => {
    await listener(testEvt)

    expect(virtualCallerSupervisorStub.check.lastCall.firstArg.caller).to.be.eq(testVirtualCaller)
  })
})
