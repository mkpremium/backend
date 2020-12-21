import { setupEventListeners } from '../../src/scheduled-events/event-listeners'
import { InMemorySyncEventBus } from '../../src/infrastructure/event-bus/in-memory-sync-event-bus'
import { spy } from 'sinon'
import { expect } from 'chai'
import { BUILDING_NEGOTIATION_STATUS_CHANGED } from '../../src/building/service/UpdateBuildingNegotiationStatusService'

describe('scheduled-events.setupEventListeners', () => {
  let eventBus
  let scheduledCallRepositoryMock

  beforeEach(() => {
    eventBus = new InMemorySyncEventBus()
    scheduledCallRepositoryMock = {
      removeScheduledCallsForBuilding: spy()
    }
    setupEventListeners(eventBus, { scheduledCallRepository: scheduledCallRepositoryMock })
  })

  it('deletes scheduled calls when a visit is scheduled for the building', () => {
    eventBus.publish({ name: 'meeting.created', buildingId: 'test-building-id' })

    expect(scheduledCallRepositoryMock.removeScheduledCallsForBuilding).to.have.been.calledWith('test-building-id')
  })

  it('deletes scheduled calls when building is mark as not for sale', () => {
    eventBus.publish({
      name: BUILDING_NEGOTIATION_STATUS_CHANGED,
      buildingId: 'test-building-id',
      negotiationStatus: 'COMPRADO'
    })
    expect(scheduledCallRepositoryMock.removeScheduledCallsForBuilding).not.to.have.been.called

    eventBus.publish({
      name: BUILDING_NEGOTIATION_STATUS_CHANGED,
      buildingId: 'test-building-id',
      negotiationStatus: 'NO VENDE'
    })

    expect(scheduledCallRepositoryMock.removeScheduledCallsForBuilding).to.have.been.calledWith('test-building-id')
  })
})
