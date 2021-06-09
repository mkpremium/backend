import { expect } from 'chai'
import sinon, { fake, spy } from 'sinon'
import { asValue, createContainer } from 'awilix'
import { worksheetEventListeners } from '../../src/worksheet/listeners'
import Sinon from 'sinon'
import { ownerBuilder } from '../owner/owner.builder'
import { OwnerStatusChangedEvent } from '../../src/owner/service/change-contact-status.service'

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
    const noopLogger = {
      info: spy(),
      error: spy(),
      crit: spy(),
    }

    const testContainer = createContainer()
    testContainer.register({
      eventBus: asValue(eventBusMock),
      releaseUserOtherActiveWorksheetsInQueueService: asValue(releaseUserOtherActiveWorksheetsInQueueServiceMock),
      updateWorksheetStatusOnOwnerChangeService: asValue(updateWorksheetStatusOnOwnerChangeSpy),
      legacyWorksheetRepository: asValue(null),
      worksheetQueueActionsService: asValue(null),
      worksheetRepository: asValue(null),
      logger: asValue(noopLogger),
      consistencyDelay: asValue(0),
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

  it('updates worksheet when owner contact status changes', (done) => {
    const testOwner = ownerBuilder({
      id: 'test-changed-owner-id',
      buildingId: 'test-building-id'
    }).build()

    const testEvent: OwnerStatusChangedEvent = {
      name: 'owner.status_changed',
      buildingId: testOwner.buildingId,
      ownerId: testOwner.id,
      oldStatus: 'NO_VERIFICADO',
      newStatus: 'WITHOUT_CONTACT',
    }
    eventSubscribers['owner.status_changed'](testEvent)

    setTimeout(() => {
      expect(updateWorksheetStatusOnOwnerChangeSpy.updateWorksheet)
        .to.have.been.calledWith(testEvent)
      done()
    }, 0)
  })
})
