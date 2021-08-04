import { expect } from 'chai'
import { PatchVirtualCallerService } from '../../../src/calls/service/patch-virtual-caller.service'

describe('PatchVirtualCallerService', () => {
  let service: PatchVirtualCallerService

  beforeEach(() => {
    service = new PatchVirtualCallerService()
  })

  it('works', () => {
    expect(service).to.be.ok
  })
})
