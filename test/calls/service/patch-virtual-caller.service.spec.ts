import { expect } from 'chai'
import { stub } from 'sinon'
import { PatchVirtualCallerService } from '../../../src/calls/service/patch-virtual-caller.service'
import { virtualCallerBuilder } from '../virtual-caller.builder'

describe('PatchVirtualCallerService', () => {
  let service: PatchVirtualCallerService
  let virtualCallersRepositoryStub

  const testCmd = {
    virtualCallerId: 'test-virtual-caller-id'
  }

  beforeEach(() => {
    virtualCallersRepositoryStub = {
      get: stub(),
      save: stub().resolves(),
    }
    service = new PatchVirtualCallerService(virtualCallersRepositoryStub)
  })

  it('fails when no patch is given', async () => {
    await expect(service.patch(testCmd)).to.be.rejected
  })

  it('changes virtual caller isEnabled prop', async () => {
    virtualCallersRepositoryStub.get.withArgs(testCmd.virtualCallerId)
      .resolves(virtualCallerBuilder({ isEnabled: true }).build())

    const updatedVirtualCaller = await service.patch({ ...testCmd, isEnabled: false })

    expect(updatedVirtualCaller.isEnabled).to.be.false
  })

  it('changes virtual caller assignCallsTo prop', async () => {
    virtualCallersRepositoryStub.get.withArgs(testCmd.virtualCallerId)
      .resolves(virtualCallerBuilder({ assignCallsTo: 'original-assignee' }).build())

    const updatedVirtualCaller = await service.patch({ ...testCmd, assignCallsTo: 'new-assignee' })

    expect(updatedVirtualCaller.assignCallsTo).to.be.eql('new-assignee')
  })
})
