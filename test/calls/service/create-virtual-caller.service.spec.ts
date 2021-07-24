import { expect } from 'chai'
import { stub } from 'sinon'
import { CreateVirtualCallerService } from '../../../src/calls/service/create-virtual-caller.service'

describe('CreateVirtualCallerService', () => {
  let service: CreateVirtualCallerService
  let virtualCallersRepositoryStub

  const spanishPhoneNumber = '+34666666666'
  const portuguesePhoneNumber = '+351666666666'
  const testCmd = {
    phoneNumber: spanishPhoneNumber,
    queueId: 'test-queue-id',
    name: 'test-virtual-caller-name',
    assignCallsTo: 'test-assign-calls-to'
  }

  beforeEach(() => {
    virtualCallersRepositoryStub = {
      save: stub().resolves(),
    }
    service = new CreateVirtualCallerService(virtualCallersRepositoryStub)
  })

  it('creates virtual caller with command values', async () => {
    await service.createVirtualCaller(testCmd)

    expect(virtualCallersRepositoryStub.save.lastCall.firstArg).to.include(testCmd)
  })

  it('creates enabled virtual caller', async () => {
    await service.createVirtualCaller(testCmd)

    expect(virtualCallersRepositoryStub.save.lastCall.firstArg).to.include({ isEnabled: true })
  })

  it('creates Spanish virtual caller', async () => {
    await service.createVirtualCaller({ ...testCmd, phoneNumber: spanishPhoneNumber })

    expect(virtualCallersRepositoryStub.save).to.have.been.calledWithMatch(
      vc => vc.language === 'spanish' && vc.timezone === 'Europe/Madrid'
    )
  })

  it('creates Portuguese virtual caller', async () => {
    await service.createVirtualCaller({ ...testCmd, phoneNumber: portuguesePhoneNumber })

    expect(virtualCallersRepositoryStub.save).to.have.been.calledWithMatch(
      vc => vc.language === 'portuguese' && vc.timezone === 'Europe/Lisbon'
    )
  })
})
