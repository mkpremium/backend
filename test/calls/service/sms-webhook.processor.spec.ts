import { expect } from 'chai'
import { SmsWebhookProcessor } from '../../../src/calls/service/sms-webhook.processor'
import { isRight, Right } from 'fp-ts/Either'
import MessagingResponse from 'twilio/lib/twiml/MessagingResponse'
import { worksheetViewBuilder } from '../../worksheet/worksheet-view.builder'
import { stub } from 'sinon'
import { outgoingSmsBuilder } from '../outgoing-sms.builder'
import { taskEither } from 'fp-ts'

describe('SmsWebhookProcessor', () => {
  let service: SmsWebhookProcessor
  let worksheetRepositoryStub
  let smsMessagesRepositoryStub
  const spanishNumber = '+34666666666'
  const portugueseNumber = '+351999999999'
  const testBuildingCity = 'TEST CITY'
  const testWorksheetView = worksheetViewBuilder().withCity(testBuildingCity).build()

  beforeEach(() => {
    worksheetRepositoryStub = {
      getForCallcenterView: stub().resolves(testWorksheetView),
    }
    smsMessagesRepositoryStub = {
      lastSentTo: stub().returns(taskEither.of(outgoingSmsBuilder({})()))
    }
    service = new SmsWebhookProcessor(
      worksheetRepositoryStub,
      smsMessagesRepositoryStub,
    )
  })

  ;[
    [ 'Spanish', spanishNumber, 'Perfecto!' ],
    [ 'Portuguese', portugueseNumber, 'Perfeito!' ],
  ].forEach(([ lang, fromNumber, expectedMessageFragment ]) =>
    it(`replies with message for owner(${lang})`, async () => {
      const message = await service.process({
        fromNumber,
        message: 'test message'
      })()

      expect(isRight(message)).to.be.true
      expect((message as Right<MessagingResponse>).right.toString())
        .to.contain(expectedMessageFragment)
    }))

  it(`includes building city name`, async () => {
    const message = await service.process({
      fromNumber: spanishNumber,
      message: 'test message'
    })()

    expect((message as Right<MessagingResponse>).right.toString())
      .to.contain(testBuildingCity)
  })
})
