import { SmsReceived } from '../../../src/calls/service/sms-webhook.processor'
import { addSmsNoteListener } from '../../../src/building/event-listener/add-sms-note.listener'
import { expect } from 'chai'
import { stub } from 'sinon'

describe('addSmsNoteListener', () => {
  let listener: (evt: SmsReceived) => Promise<void>
  let buildingNotesRepositoryStub

  beforeEach(() => {
    buildingNotesRepositoryStub = {
      save: stub().resolves()
    }

    listener = addSmsNoteListener({ buildingNotesRepository: buildingNotesRepositoryStub })
  })

  it('adds note to building', async () => {
    const testSmsReceivedEvent: SmsReceived = {
      name: 'virtual_caller.sms_received',
      buildingId: 'test-building-id',
      message: 'test message',
      ownerId: 'test-owner-id',
      callerId: '',
      contactId: '',
      worksheetId: '',
    }
    await listener(testSmsReceivedEvent)

    expect(buildingNotesRepositoryStub.save).to.have.been.called
    const savedNote = buildingNotesRepositoryStub.save.lastCall.firstArg
    expect(savedNote.note).to.include(testSmsReceivedEvent.message)
    expect(savedNote.note).to.include('SMS')
    expect(savedNote.createdBy).to.be.equal(testSmsReceivedEvent.ownerId)
    expect(savedNote.context.buildingId).to.be.equal(testSmsReceivedEvent.buildingId)
  })
})
