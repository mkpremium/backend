import { scheduledEventsEventListeners } from '../../src/scheduled-events/event-listeners'
import { InMemorySyncEventBus } from '../../src/infrastructure/event-bus/in-memory-sync-event-bus'
import { spy } from 'sinon'
import { expect } from 'chai'
import { asFunction, asValue, createContainer } from 'awilix'
import {
  removeCallsOnNewMeetingOrOfferRequest
} from '../../src/scheduled-events/listeners/remove-calls-on-new-meeting-or-offer-request'
import {
  removeScheduledCallsOnOwnerRefusal
} from '../../src/scheduled-events/listeners/remove-scheduled-calls-on-owner-refusal'
import {
  removeScheduledCallOnDiscardedContact
} from '../../src/scheduled-events/listeners/remove-scheduled-call-on-discarded-contact'
import { DomainEventCatalog } from '../../src/infrastructure/postgres/domain-event.entity'

describe('scheduled-events.setupEventListeners', () => {
  let eventBus
  let removeScheduledCallsServiceMock
  let scheduledCallRepositoryMock

  beforeEach(() => {
    eventBus = new InMemorySyncEventBus()
    scheduledCallRepositoryMock = { removeScheduledCallsForBuilding: spy() }
    removeScheduledCallsServiceMock = { removeScheduledCallsFor: spy() }
    const container = createContainer()
    container.register({
      eventBus: asValue(eventBus),
      scheduledCallsRepository: asValue(scheduledCallRepositoryMock),
      removeScheduledCallsService: asValue(removeScheduledCallsServiceMock),
      scheduledCallFromOwnerMessage: asValue(undefined),
      removeCallsOnNewMeetingOrOfferRequest: asFunction(removeCallsOnNewMeetingOrOfferRequest).singleton(),
      removeScheduledCallsOnOwnerRefusal: asFunction(removeScheduledCallsOnOwnerRefusal).singleton(),
      removeScheduledCallOnDiscardedContact: asFunction(removeScheduledCallOnDiscardedContact).singleton(),
      entityManager: asValue(undefined)
    })
    scheduledEventsEventListeners(eventBus, container)
  })

  it('deletes scheduled calls when a visit is scheduled for the building', () => {
    eventBus.publish({ name: DomainEventCatalog.SCHEDULED_EVENTS__MEETING_CREATED, buildingId: 'test-building-id' })

    expect(removeScheduledCallsServiceMock.removeScheduledCallsFor).to.have.been.calledWith('test-building-id')
  })

  it('deletes scheduled calls when building is mark as not for sale', () => {
    eventBus.publish({
      name: DomainEventCatalog.BUILDING__NEGOTIATION_STATUS_CHANGED,
      buildingId: 'test-building-id',
      negotiationStatus: 'NO VENDE'
    })

    expect(removeScheduledCallsServiceMock.removeScheduledCallsFor).to.have.been.calledWith('test-building-id')
  })

  it('deletes scheduled calls when building is discarded', () => {
    eventBus.publish({
      name: DomainEventCatalog.BUILDING__NEGOTIATION_STATUS_CHANGED,
      buildingId: 'test-building-id',
      negotiationStatus: 'DESCARTADO'
    })

    expect(removeScheduledCallsServiceMock.removeScheduledCallsFor).to.have.been.calledWith('test-building-id')
  })
})
