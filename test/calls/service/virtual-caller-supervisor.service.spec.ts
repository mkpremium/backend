import { expect } from 'chai'
import { stub } from 'sinon'
import { VirtualCallerSupervisorService } from '../../../src/calls/service/virtual-caller-supervisor.service'

const testCmd = {
  callerId: 'test-caller-id',
  queueId: 'test-queue-id',
  maxWorksheets: 100,
}

describe('VirtualCallerSupervisorService', () => {
  let service!: VirtualCallerSupervisorService
  let virtualCallerStub

  beforeEach(() => {
    virtualCallerStub = {
      processNextWorksheet: stub(),
    }

    service = new VirtualCallerSupervisorService(
      virtualCallerStub,
    )
  })

  it('makes virtual caller process next worksheet', async () => {
    await service.check(testCmd)

    expect(virtualCallerStub.processNextWorksheet).to.have.been.calledOnceWith({
      callerId: testCmd.callerId,
      queueId: testCmd.queueId,
      contacts: VirtualCallerSupervisorService.contactsOrderStrategy
    })
  })
})
