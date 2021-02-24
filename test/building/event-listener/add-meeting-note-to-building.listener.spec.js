import { createAddNoteToBuildingListener } from '../../../src/building/event-listener/add-note-to-building.listener'
import { expect } from 'chai'
import { stub } from 'sinon'

describe('add-meeting-note-to-building.listener', () => {
  let listener
  let buildingNotesRepositoryStub

  beforeEach(() => {
    buildingNotesRepositoryStub = {
      save: stub()
    }

    listener = createAddNoteToBuildingListener({ buildingNotesRepository: buildingNotesRepositoryStub })
  })

  it('creates note in building with meeting note text', () => {
    const testMeetingCreatedEvent = {
      buildingId: 'test-building-id',
      userId: 'test-user-id',
      note: 'test meeting note'
    }
    buildingNotesRepositoryStub.save.resolves()

    return listener(testMeetingCreatedEvent)
      .then(() => {
        expect(buildingNotesRepositoryStub.save).to.have.been.calledWithMatch(
          n => n.note === testMeetingCreatedEvent.note && n.createdBy === testMeetingCreatedEvent.userId &&
            n.context.buildingId === testMeetingCreatedEvent.buildingId
        )
      })
  })

  it('does nothing when no note is given', () => {
    const testMeetingCreatedEvent = {
      buildingId: 'test-building-id',
      userId: 'test-user-id',
      note: undefined
    }

    return listener(testMeetingCreatedEvent)
      .then(() => {
        expect(buildingNotesRepositoryStub.save).to.not.have.been.called
      })
  })
})
