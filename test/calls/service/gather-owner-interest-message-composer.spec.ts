import {
  GatherInterestMessageComposeCommand,
  GatherOwnerInterestMessageComposer
} from '../../../src/calls/service/gather-owner-interest-message-composer'
import { expect } from 'chai'
import { virtualCallerBuilder } from '../virtual-caller.builder'

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
const testPublicUrl = 'http://api.public.url'
const testComposeCmd: GatherInterestMessageComposeCommand = {
  buildingId: 'test-building-id',
  worksheetId: 'test-worksheet-id',
  callId: 'test-call-id',
  language: 'es-ES',
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

describe('GatherOwnerInterestMessageComposer', () => {
  let composer: GatherOwnerInterestMessageComposer

  beforeEach(() => {
    composer = new GatherOwnerInterestMessageComposer(testPublicUrl, twilioSayAttributesTest)
  })

  it('composes Spanish message', () => {
    const composedMessage = composer.compose({ ...testComposeCmd, language: 'es-ES' })

    expect(composedMessage.toString()).to.include('Buenos días')
    expect(composedMessage.toString()).to.include('es-ES')
    expect(composedMessage.toString()).to.include(`voice="${twilioSayAttributesTest[ 'es-ES' ].voice}"`)
  })

  it('composes Portuguese message', () => {
    const composedMessage = composer.compose({ ...testComposeCmd, language: 'pt-PT' })

    expect(composedMessage.toString()).to.include('Bom dia')
    expect(composedMessage.toString()).to.include('pt-PT')
    expect(composedMessage.toString()).to.include(`voice="${twilioSayAttributesTest[ 'pt-PT' ].voice}"`)
  })
})
