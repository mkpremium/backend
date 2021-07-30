import { expect } from 'chai'
import { stub } from 'sinon'
import { CallCommand, VirtualCallerPhone } from '../../../src/calls/service/virtual-caller-phone'
import { virtualCallerBuilder } from '../virtual-caller.builder'

const testPublicUrl = 'http://api.public.url'
const testVirtualCallerPhoneNumber = '+34666666667'
const testCmd: CallCommand = {
  buildingId: 'test-building-id',
  worksheetId: 'test-worksheet-id',
  caller: virtualCallerBuilder({
    id: 'test-virtual-caller-id',
    phoneNumber: testVirtualCallerPhoneNumber,
  }).build(),
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
  const twilioSayAttributesTest = {
    'es-ES': {
      language: 'es-ES' as 'es-ES',
      voice: 'Polly.Conchita' as 'Polly.Conchita',
    },
    'pt-PT': {
      language: 'pt-PT' as 'pt-PT',
      voice: 'Polly.Cristiano' as 'Polly.Cristiano',
    }
  }

  beforeEach(() => {
    twilioClientStub = {
      calls: {
        create: stub().resolves()
      }
    }
    virtualCallsRepositoryStub = {
      lastCallToNumber: stub().resolves(),
      save: stub().resolves(),
      lockPhone: stub(),
      unlockPhone: stub(),
    }

    service = new VirtualCallerPhone(
      twilioClientStub,
      testPublicUrl,
      virtualCallsRepositoryStub,
      twilioSayAttributesTest,
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

  it('acquires phone lock before calling and releases when call is done', async () => {
    const testPhoneLock = 'test-cas-lock'
    virtualCallsRepositoryStub.lockPhone.resolves(testPhoneLock)

    await service.call(testCmd)

    expect(virtualCallsRepositoryStub.lockPhone).to.have.been.calledWith(testVirtualCallerPhoneNumber)
    expect(virtualCallsRepositoryStub.lockPhone).to.have.been.calledBefore(twilioClientStub.calls.create)
    expect(virtualCallsRepositoryStub.unlockPhone).to.have.been.calledWith(testVirtualCallerPhoneNumber, testPhoneLock)
  })

  it('calculates prefix based on caller timezone', async () => {
    await service.call({ ...testCmd, caller: virtualCallerBuilder({ timezone: 'Europe/Madrid' }).build() })
    expect(twilioClientStub.calls.create.lastCall.firstArg.to).to.match(/^\+34/)

    await service.call({ ...testCmd, caller: virtualCallerBuilder({ timezone: 'Europe/Lisbon' }).build() })
    expect(twilioClientStub.calls.create.lastCall.firstArg.to).to.match(/^\+351/)
  })

  it('calls using Spanish for Europe/Madrid timezone', async () => {
    await service.call({ ...testCmd, caller: virtualCallerBuilder({ timezone: 'Europe/Madrid' }).build() })

    expect(twilioClientStub.calls.create.lastCall.firstArg.twiml).to.include('Buenos días')
    expect(twilioClientStub.calls.create.lastCall.firstArg.twiml).to.include('es-ES')
    expect(twilioClientStub.calls.create.lastCall.firstArg.twiml).to.include(`voice="${twilioSayAttributesTest['es-ES'].voice}"`)
  })

  it('calls using Portuguese for Europe/Lisbon timezone', async () => {
    await service.call({ ...testCmd, caller: virtualCallerBuilder({ timezone: 'Europe/Lisbon' }).build() })

    expect(twilioClientStub.calls.create.lastCall.firstArg.twiml).to.include('Bom dia')
    expect(twilioClientStub.calls.create.lastCall.firstArg.twiml).to.include('language="pt-PT"')
    expect(twilioClientStub.calls.create.lastCall.firstArg.twiml).to.include(`voice="${twilioSayAttributesTest['pt-PT'].voice}"`)
  })

  // 13223 Invalid phone number format
  // 20003 Permission Denied
  // 21211 Invalid 'To' Phone Number ex. 934122309/933478789
  // 21215 Geo Permission configuration is not permitting call
  // ETIMEDOUT
})
