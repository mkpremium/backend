import { setupEventListeners } from '../../src/scheduled-events/event-listeners'
import { InMemorySyncEventBus } from '../../src/infrastructure/event-bus/in-memory-sync-event-bus'
import { spy } from 'sinon'
import { expect } from 'chai'

describe('scheduled-events.setupEventListeners', () => {
  it('deletes scheduled calls when a visit is scheduled for the building', () => {
    const eventBus = new InMemorySyncEventBus()
    const scheduledCallRepositoryMock = {
      removeScheduledCallsForBuilding: spy()
    }
    setupEventListeners(eventBus, { scheduledCallRepository: scheduledCallRepositoryMock })

    eventBus.publish({name: 'meeting.created', buildingId: 'test-building-id'})

    expect(scheduledCallRepositoryMock.removeScheduledCallsForBuilding).to.have.been.calledWith('test-building-id')
  })
})
