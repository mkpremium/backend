import { expect } from 'chai'
import sinon, { fake, spy } from 'sinon'
import { asValue, createContainer } from 'awilix'
import { worksheetEventListeners } from '../../src/worksheet/listeners'
import Sinon from 'sinon'
import { ownerBuilder } from '../owner/owner.builder'

describe('worksheetEventListeners', () => {
  let eventSubscribers
  let eventBusMock: { on: Sinon.SinonSpy }
  let releaseUserOtherActiveWorksheetsInQueueServiceMock: { release: Sinon.SinonSpy }
  let updateWorksheetStatusOnOwnerChangeSpy

  beforeEach(() => {
    eventSubscribers = {}
    eventBusMock = {
      on: fake((eventName, subscriber) => {
        eventSubscribers[eventName] = subscriber
      })
    }
    releaseUserOtherActiveWorksheetsInQueueServiceMock = { release: spy() }
    updateWorksheetStatusOnOwnerChangeSpy = { updateWorksheet: spy() }

    const testContainer = createContainer()
    testContainer.register({
      eventBus: asValue(eventBusMock),
      releaseUserOtherActiveWorksheetsInQueueService: asValue(releaseUserOtherActiveWorksheetsInQueueServiceMock),
      updateWorksheetStatusOnOwnerChangeService: asValue(updateWorksheetStatusOnOwnerChangeSpy),
      legacyWorksheetRepository: asValue(null),
      worksheetQueueActionsService: asValue(null)
    })
    worksheetEventListeners(testContainer)
  })

  it('releases other worksheets taken by user when takes another', () => {
    expect(eventBusMock.on).to.have.been.calledWith('worksheet.taken', sinon.match.func)
    const testWorksheetTakenEvent = { queueId: 'test-queue-id', by: 'test-user-id' }

    eventSubscribers['worksheet.taken'](testWorksheetTakenEvent)

    expect(releaseUserOtherActiveWorksheetsInQueueServiceMock.release).to.have.been
      .calledWith(testWorksheetTakenEvent.by, testWorksheetTakenEvent.queueId)
  })

  it('updates worksheet when owner contact status changes', () => {
    const testOwner = ownerBuilder({
      id: 'test-changed-owner-id',
      buildingId: 'test-building-id'
    }).build()

    eventSubscribers['owner.contact_status_changed']({ owner: testOwner })

    expect(updateWorksheetStatusOnOwnerChangeSpy.updateWorksheet)
      .to.have.been.calledWith(testOwner.buildingId, testOwner.id)
  })
})
