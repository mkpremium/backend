import { expect } from 'chai'
import { stub } from 'sinon'
import { CreateVirtualCallerService } from '../../../src/calls/service/create-virtual-caller.service'
import { worksheetQueueBuilder } from '../../worksheet/worksheet-queue.builder'
import { EntityNotFound } from '../../../src/db/errors'
import { WorksheetQueue } from '../../../src/worksheet/domain/queue'
import { userBuilder } from '../../user/user.builder'
import { User } from '../../../src/types/user'

describe.skip('CreateVirtualCallerService', () => {
  let service: CreateVirtualCallerService
  let virtualCallersRepositoryStub
  let worksheetQueueRepositoryStub
  let usersRepositoryStub

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
    worksheetQueueRepositoryStub = {
      get: stub().resolves(worksheetQueueBuilder().build())
    }
    usersRepositoryStub = {
      get: stub().resolves(userBuilder().build())
    }

    service = new CreateVirtualCallerService(
      virtualCallersRepositoryStub,
      worksheetQueueRepositoryStub,
      usersRepositoryStub,
    )
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

  it('checks that queue exists', async () => {
    worksheetQueueRepositoryStub.get.withArgs(testCmd.queueId)
      .rejects(new EntityNotFound(testCmd.queueId, WorksheetQueue))

    await expect(service.createVirtualCaller(testCmd)).to.be.rejected
  })

  it('checks that user exists', async () => {
    usersRepositoryStub.get.withArgs(testCmd.assignCallsTo)
      .rejects(new EntityNotFound(testCmd.queueId, User))

    await expect(service.createVirtualCaller(testCmd)).to.be.rejected
  })
})
