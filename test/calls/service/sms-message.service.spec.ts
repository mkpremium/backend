import { expect } from 'chai'
import { stub } from 'sinon'
import { SendMessageToUnreachedOwnerCodec, SmsMessageSender } from '../../../src/calls/service/sms-message.service'
import { WorksheetViewProps } from '../../../src/worksheet/repository/worksheet.repository'
import { worksheetViewBuilder } from '../../worksheet/worksheet-view.builder'
import { taskEither } from 'fp-ts'
import { isRight } from 'fp-ts/Either'
import { PathReporter } from 'io-ts/PathReporter'
import moment from 'moment'
import { constVoid } from 'fp-ts/function'

const testPreviousWeekMessageToPhone = {
  lastSmsSentAt: moment().add(-1, 'month').add(-1, 'day').toDate(),
}
const testCas = 'test-cas'
describe('SmsMessageSender', () => {
  let service: SmsMessageSender
  let twilioClientStub
  let worksheetRepositoryStub
  let smsMessagesRepositoryStub
  let buildingOwnerPhonesRepositoryStub
  const spanishNumber = '+34666666666'
  const portugueseNumber = '+351999999999'
  const testWorksheet: WorksheetViewProps = worksheetViewBuilder().build()

  beforeEach(() => {
    twilioClientStub = {
      messages: {
        create: stub().resolves(),
      }
    }
    worksheetRepositoryStub = {
      getForCallcenterView: stub().resolves(testWorksheet)
    }
    smsMessagesRepositoryStub = {
      addOutgoing: stub().returns(taskEither.of(undefined))
    }
    buildingOwnerPhonesRepositoryStub = {
      getByPhoneNumberAndLock: stub().returns(taskEither.of({
        ownerPhone: testPreviousWeekMessageToPhone,
        cas: testCas
      })),
      save: stub().returns(taskEither.of(constVoid())),
    }

    service = new SmsMessageSender(
      twilioClientStub,
      worksheetRepositoryStub,
      smsMessagesRepositoryStub,
      buildingOwnerPhonesRepositoryStub,
    )
  })

  it('sends Spanish message to Spain numbers', async () => {
    await service.sendMessageToUnreachedOwner(sendMessageToUnreachedOwnerBuilder({ to: spanishNumber })())()

    expect(twilioClientStub.messages.create).to.have.been.calledWithMatch(({ body }) => body.startsWith('Hola,'))
  })

  it('sends Portuguese message to Portugal numbers', async () => {
    await service.sendMessageToUnreachedOwner(sendMessageToUnreachedOwnerBuilder({ to: portugueseNumber })())()

    expect(twilioClientStub.messages.create).to.have.been.calledWithMatch(({ body }) => body.startsWith('Ola'))
  })

  it('saves SMS', async () => {
    await service.sendMessageToUnreachedOwner(sendMessageToUnreachedOwnerBuilder()())()

    expect(smsMessagesRepositoryStub.addOutgoing).to.have.been.called
  })

  ;[
    [ spanishNumber, 'Spanish' ],
    [ portugueseNumber, 'Portuguese' ],
  ].forEach(([ to, lang ]) => it(`includes address and city in message when it fits in SMS message limit(${lang})`, async () => {
    worksheetRepositoryStub.getForCallcenterView.resolves({
      ...testWorksheet,
      building: {
        ...testWorksheet.building,
        address: {
          ...testWorksheet.building.address,
          city: 'city',
          street: 'street',
          number: 1
        }
      }
    })

    await service.sendMessageToUnreachedOwner(sendMessageToUnreachedOwnerBuilder({ to })())()

    expect(twilioClientStub.messages.create).to.have.been
      .calledWithMatch(({ body }) => body.includes('street 1 de city') && body.length < 160)
  }))

  ;[
    [ spanishNumber, 'Spanish' ],
    [ portugueseNumber, 'Portuguese' ],
  ].forEach(([ to, lang ]) => it(`keeps message under SMS limit(${lang})`, async () => {
    worksheetRepositoryStub.getForCallcenterView.resolves({
      ...testWorksheet,
      building: {
        ...testWorksheet.building,
        address: {
          ...testWorksheet.building.address,
          city: 'veeeeeeeeeeeeeeeeeeeeeeeeeeery long city name',
          street: 'veeeeeeeeeeeeeeeeeeeeeeeeeery long street name',
          number: 1
        }
      }
    })

    await service.sendMessageToUnreachedOwner(sendMessageToUnreachedOwnerBuilder({ to })())()

    expect(twilioClientStub.messages.create).to.have.been
      .calledWithMatch(({ body }) => body.length < 160)
  }))

  it('does not send more than one message monthly to owner', async () => {
    buildingOwnerPhonesRepositoryStub.getByPhoneNumberAndLock.returns(taskEither.of({
      ownerPhone: {
        lastSmsSentAt: moment().add(-1, 'month'),
      },
      cas: testCas,
    }))

    const result = await service.sendMessageToUnreachedOwner(sendMessageToUnreachedOwnerBuilder()())()

    expect(isRight(result)).to.be.false
    expect(smsMessagesRepositoryStub.addOutgoing).to.not.have.been.called
    expect(twilioClientStub.messages.create).to.not.have.been.called
  })

  it('does send message when last message is from a previous month', async () => {
    const result = await service.sendMessageToUnreachedOwner(sendMessageToUnreachedOwnerBuilder()())()

    expect(isRight(result)).to.be.true
    expect(smsMessagesRepositoryStub.addOutgoing).to.have.been.called
    expect(twilioClientStub.messages.create).to.have.been.called
  })

  it('updates owner phone with last SMS sent timestamp', async () => {
    const before = new Date()
    await service.sendMessageToUnreachedOwner(sendMessageToUnreachedOwnerBuilder()())()

    expect(buildingOwnerPhonesRepositoryStub.save).to.have.been.calledOnce
    expect(buildingOwnerPhonesRepositoryStub.save.lastCall.firstArg.lastSmsSentAt)
      .to.be.within(before, new Date())
    expect(buildingOwnerPhonesRepositoryStub.save.lastCall.lastArg)
      .to.be.equal(testCas)
  })
})

function sendMessageToUnreachedOwnerBuilder (overrides = {}) {
  return function () {
    const decodedCmd = SendMessageToUnreachedOwnerCodec.decode({
        to: '+349999999',
        callerId: 'test-caller-id',
        contactId: 'test-contact-id',
        ownerId: 'test-owner-id',
        worksheetId: 'test-worksheet-id',
        ...overrides,
      }
    )
    if (!isRight(decodedCmd)) {
      throw new Error(PathReporter.report(decodedCmd).join('\n'))
    }

    return decodedCmd.right
  }
}
