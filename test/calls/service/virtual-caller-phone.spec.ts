import { expect } from 'chai'
import { VirtualCallerPhone } from '../../../src/calls/service/virtual-caller-phone'

describe('VirtualCallerPhone', () => {
  let service: VirtualCallerPhone
  let twilioClientStub
  let virtualCallsRepositoryStub
  let twilioSayAttributes

  beforeEach(() => {
    service = new VirtualCallerPhone(
      twilioClientStub,
      'https://virtual-caller.mkpremium.net',
      virtualCallsRepositoryStub,
      twilioSayAttributes
    )
  })

  it('works', () => {
    expect(service).to.be.ok
  })
})
