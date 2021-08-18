import { expect } from 'chai'
import { stub } from 'sinon'
import { CallCommand, VirtualCallerPhone } from '../../../src/calls/service/virtual-caller-phone'
import { virtualCallerBuilder } from '../virtual-caller.builder'
import moment from 'moment'
import { OwnerResponse } from '../../../src/calls/service/owner-response-processor.service'
import { callBuilder } from '../call.builder'
import { CallerPhone } from '../../../src/calls/domain/caller.phone'

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
  let virtualCallerPhonesRepositoryStub
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
  const testAvailableLockedPhone = {
    phone: CallerPhone({
      id: `phone_${testVirtualCallerPhoneNumber}`,
      status: 'AVAILABLE'
    } as any),
    cas: 'test-cas-lock'
  }

  beforeEach(() => {
    twilioClientStub = {
      calls: {
        create: stub().resolves()
      }
    }
    virtualCallsRepositoryStub = {
      previousCallsToNumber: stub().resolves(),
      save: stub().resolves(),
    }
    virtualCallerPhonesRepositoryStub = {
      lockPhone: stub().resolves(testAvailableLockedPhone),
      unlockPhone: stub(),
      saveWithLock: stub(),
    }

    service = new VirtualCallerPhone(
      twilioClientStub,
      testPublicUrl,
      virtualCallsRepositoryStub,
      twilioSayAttributesTest,
      virtualCallerPhonesRepositoryStub,
      { error: () => undefined } as any,
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
    await service.call(testCmd)

    expect(virtualCallerPhonesRepositoryStub.lockPhone).to.have.been.calledWith(testVirtualCallerPhoneNumber)
    expect(virtualCallerPhonesRepositoryStub.lockPhone).to.have.been.calledBefore(twilioClientStub.calls.create)
    expect(virtualCallerPhonesRepositoryStub.saveWithLock).to.have.been.called
    expect(virtualCallerPhonesRepositoryStub.saveWithLock.lastCall.firstArg.phone.status)
      .to.be.equal('BUSY')
  })

  it('throws error when phone is busy', async () => {
    virtualCallerPhonesRepositoryStub.lockPhone.resolves({ ...testAvailableLockedPhone, phone: { status: 'BUSY' } })

    await expect(service.call(testCmd)).to.be.rejected
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
    expect(twilioClientStub.calls.create.lastCall.firstArg.twiml).to.include(`voice="${twilioSayAttributesTest[ 'es-ES' ].voice}"`)
  })

  it('calls using Portuguese for Europe/Lisbon timezone', async () => {
    await service.call({ ...testCmd, caller: virtualCallerBuilder({ timezone: 'Europe/Lisbon' }).build() })

    expect(twilioClientStub.calls.create.lastCall.firstArg.twiml).to.include('Bom dia')
    expect(twilioClientStub.calls.create.lastCall.firstArg.twiml).to.include('language="pt-PT"')
    expect(twilioClientStub.calls.create.lastCall.firstArg.twiml).to.include(`voice="${twilioSayAttributesTest[ 'pt-PT' ].voice}"`)
  })

  it('does not call when phone number is already called today', async () => {
    virtualCallsRepositoryStub.previousCallsToNumber.resolves([ callBuilder({
      createdAt: new Date(),
      status: 'DONE',
      worksheetId: 'any-worksheet',
    }).build() ])

    await expect(service.call(testCmd)).to.be.rejected
  })

  it('calls to phone number when it was called some previous day without a response', async () => {
    virtualCallsRepositoryStub.previousCallsToNumber.resolves([ callBuilder({
      createdAt: moment().add(-1, 'day').toDate(),
      ownerResponse: undefined
    }).build() ])

    await service.call(testCmd)

    expect(twilioClientStub.calls.create).to.have.been.called
  })

  it('does not call to phone number when it was called some previous day with a response', async () => {
    virtualCallsRepositoryStub.previousCallsToNumber.resolves([ callBuilder({
      status: 'DONE',
      createdAt: moment().add(-1, 'day').toDate(),
      ownerResponse: OwnerResponse.SALE,
    }).build() ])

    await expect(service.call(testCmd)).to.be.rejected
  })

  it('calls to phone number even if it was called some date before with a response but for a different worksheet', async () => {
    virtualCallsRepositoryStub.previousCallsToNumber.resolves([ callBuilder({
      status: 'DONE',
      createdAt: moment().add(-1, 'day').toDate(),
      ownerResponse: OwnerResponse.NO_SALE,
      worksheetId: 'a-different-worksheet',
    }).build() ])

    await service.call(testCmd)

    expect(twilioClientStub.calls.create).to.have.been.called
  })

  it('calls to phone number previous call failed', async () => {
    virtualCallsRepositoryStub.previousCallsToNumber.resolves([ callBuilder({
      createdAt: new Date(),
      status: 'FAILED',
    }).build() ])

    await service.call(testCmd)

    expect(twilioClientStub.calls.create).to.have.been.called
  })

  it('calls to phone number when it was called three or more months ago, even with response', async () => {
    virtualCallsRepositoryStub.previousCallsToNumber.resolves([ callBuilder({
      createdAt: moment().add(-3, 'months').toDate(),
      ownerResponse: OwnerResponse.SALE,
    }).build() ])

    await service.call(testCmd)

    expect(twilioClientStub.calls.create).to.have.been.called
  })

  // 13223 Invalid phone number format
  // 20003 Permission Denied
  // 21211 Invalid 'To' Phone Number ex. 934122309/933478789
  // 21215 Geo Permission configuration is not permitting call
  // ETIMEDOUT
})
