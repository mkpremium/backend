import { expect } from 'chai'
import { stub } from 'sinon'
import { CallCommand, VirtualCallerPhone } from '../../../src/calls/service/virtual-caller-phone'

const testPublicUrl = 'http://api.public.url'
const testCmd: CallCommand = {
  buildingId: 'test-building-id',
  worksheetId: 'test-worksheet-id',
  contact: {
    id: 'test-contact-id',
    ownerId: 'test-owner-id',
    status: undefined,
    type: undefined,
    value: '666666666',
  },
  address: {
    city: 'Test City',
    street: 'Test Street',
    number: 0,
  },
}

describe('VirtualCallerPhone', () => {
  let service: VirtualCallerPhone
  let twilioClientStub
  let virtualCallsRepositoryStub
  let twilioSayAttributesTest

  let testVirtualCallerPhoneNumber
  beforeEach(() => {
    twilioClientStub = {
      calls: {
        create: stub().resolves()
      }
    }
    virtualCallsRepositoryStub = {
      lastCallToNumber: stub().resolves(),
      save: stub().resolves(),
    }
    twilioSayAttributesTest = {}

    testVirtualCallerPhoneNumber = {}
    service = new VirtualCallerPhone(
      twilioClientStub,
      testPublicUrl,
      virtualCallsRepositoryStub,
      twilioSayAttributesTest,
      testVirtualCallerPhoneNumber,
    )
  })

  it('calls contact', async () => {
    await service.call(testCmd)

    const savedCall = virtualCallsRepositoryStub.save.lastCall.firstArg
    expect(twilioClientStub.calls.create).to.have.been.calledOnce
    expect(twilioClientStub.calls.create.lastCall.firstArg).to.include({
      callerId: testVirtualCallerPhoneNumber,
      from: testVirtualCallerPhoneNumber,
      to: '+34' + testCmd.contact.value,
      machineDetection: 'Enable',
      asyncAmd: 'true',
      asyncAmdStatusCallbackMethod: 'POST',
      asyncAmdStatusCallback: `${testPublicUrl}/calls/twilio/${savedCall.id}/machine-detection`,
      statusCallback: `${testPublicUrl}/calls/twilio/${savedCall.id}/done`
    })
  })
})
