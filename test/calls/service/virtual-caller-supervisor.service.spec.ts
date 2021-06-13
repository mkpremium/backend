import { expect } from 'chai'
import { spy, stub } from 'sinon'
import { VirtualCallerSupervisorService } from '../../../src/calls/service/virtual-caller-supervisor.service'

const testCmd = {
  callerId: 'test-caller-id',
  queueId: 'test-queue-id',
  maxWorksheets: 100,
}

describe('VirtualCallerSupervisorService', () => {
  let service!: VirtualCallerSupervisorService
  let virtualCallerStub
  let virtualCallerWorksheetsRepositoryStub
  let loggerSpy

  beforeEach(() => {
    virtualCallerStub = {
      processNextWorksheet: stub(),
    }
    virtualCallerWorksheetsRepositoryStub = {
      numberOfWorksheetsProcessedBy: stub(),
    }
    loggerSpy = {
      info: spy(),
    }

    service = new VirtualCallerSupervisorService(
      virtualCallerStub,
      virtualCallerWorksheetsRepositoryStub,
      loggerSpy,
    )
  })

  it('makes virtual caller process next worksheet', async () => {
    virtualCallerWorksheetsRepositoryStub.numberOfWorksheetsProcessedBy.withArgs(testCmd.callerId).resolves(0)

    await service.check(testCmd)

    expect(virtualCallerStub.processNextWorksheet).to.have.been.calledOnceWith({
      callerId: testCmd.callerId,
      queueId: testCmd.queueId,
      contacts: VirtualCallerSupervisorService.contactsOrderStrategy
    })
  })

  it('does not invoke virtual caller when max worksheets have been processed', async () => {
    virtualCallerWorksheetsRepositoryStub.numberOfWorksheetsProcessedBy.withArgs(testCmd.callerId)
      .resolves(testCmd.maxWorksheets)

    await service.check(testCmd)

    expect(virtualCallerStub.processNextWorksheet).to.not.have.been.called
    expect(loggerSpy.info).to.have.been.called
  })
})
