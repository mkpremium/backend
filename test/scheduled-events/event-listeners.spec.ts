import { setupEventListeners } from '../../src/scheduled-events/event-listeners'
import { InMemorySyncEventBus } from '../../src/infrastructure/event-bus/in-memory-sync-event-bus'
import { spy } from 'sinon'
import { expect } from 'chai'
import { BUILDING_NEGOTIATION_STATUS_CHANGED } from '../../src/building/service/update-building-negotiation-status.service'
import { asValue, createContainer } from 'awilix'

describe('scheduled-events.setupEventListeners', () => {
  let eventBus
  let scheduledCallRepositoryMock

  beforeEach(() => {
    eventBus = new InMemorySyncEventBus()
    scheduledCallRepositoryMock = {
      removeScheduledCallsForBuilding: spy()
    }
    const container = createContainer()
    container.register({
      eventBus: asValue(eventBus),
      scheduledCallsRepository: asValue(scheduledCallRepositoryMock),
      scheduledCallFromOwnerMessage: asValue(undefined),
    })
    setupEventListeners(container)
  })

  it('deletes scheduled calls when a visit is scheduled for the building', () => {
    eventBus.publish({ name: 'meeting.created', buildingId: 'test-building-id' })

    expect(scheduledCallRepositoryMock.removeScheduledCallsForBuilding).to.have.been.calledWith('test-building-id')
  })

  it('deletes scheduled calls when building is mark as not for sale', () => {
    eventBus.publish({
      name: BUILDING_NEGOTIATION_STATUS_CHANGED,
      buildingId: 'test-building-id',
      negotiationStatus: 'NO VENDE'
    })

    expect(scheduledCallRepositoryMock.removeScheduledCallsForBuilding).to.have.been.calledWith('test-building-id')
  })

  it('deletes scheduled calls when building is discarded', () => {
    eventBus.publish({
      name: BUILDING_NEGOTIATION_STATUS_CHANGED,
      buildingId: 'test-building-id',
      negotiationStatus: 'DESCARTADO'
    })

    expect(scheduledCallRepositoryMock.removeScheduledCallsForBuilding).to.have.been.calledWith('test-building-id')
  })
})
