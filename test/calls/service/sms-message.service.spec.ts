import { expect } from 'chai'
import { stub } from 'sinon'
import { SmsMessageSender } from '../../../src/calls/service/sms-message.service'
import { WorksheetViewProps } from '../../../src/worksheet/repository/worksheet.repository'
import { worksheetViewBuilder } from '../../worksheet/worksheet-view.builder'
import { taskEither } from 'fp-ts'

describe('SmsMessageSender', () => {
  let service: SmsMessageSender
  let twilioClientStub
  let worksheetRepositoryStub
  let smsMessagesRepositoryStub
  const spanishNumber = '+34666666666'
  const portugueseNumber = '+351999999999'
  const testCmd = {
    to: spanishNumber,
    callerId: 'test-caller-id',
    contactId: 'test-contact-id',
    ownerId: 'test-owner-id',
    worksheetId: 'test-worksheet-id',
  }
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

    service = new SmsMessageSender(
      twilioClientStub,
      worksheetRepositoryStub,
      smsMessagesRepositoryStub,
    )
  })

  it('sends Spanish message to Spain numbers', async () => {
    await service.sendMessageToUnreachedOwner({ ...testCmd, to: spanishNumber })()

    expect(twilioClientStub.messages.create).to.have.been.calledWithMatch(({ body }) => body.startsWith('Hola,'))
  })

  it('sends Portuguese message to Portugal numbers', async () => {
    await service.sendMessageToUnreachedOwner({ ...testCmd, to: portugueseNumber })()

    expect(twilioClientStub.messages.create).to.have.been.calledWithMatch(({ body }) => body.startsWith('Olá,'))
  })

  it('saves SMS', async () => {
    await service.sendMessageToUnreachedOwner({ ...testCmd, to: spanishNumber })()

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

    await service.sendMessageToUnreachedOwner({ ...testCmd, to })()

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

    await service.sendMessageToUnreachedOwner({ ...testCmd, to })()

    expect(twilioClientStub.messages.create).to.have.been
      .calledWithMatch(({ body }) => body.length < 160)
  }))
})
