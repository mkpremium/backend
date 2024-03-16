import { expect } from 'chai'
import sinon, { fake, spy } from 'sinon'
import { asValue, createContainer } from 'awilix'
import { worksheetEventListeners } from '../../src/worksheet/listeners'

describe('worksheetEventListeners', () => {
  let eventSubscribers
  let eventBusMock
  let releaseUserOtherActiveWorksheetsInQueueServiceMock: { release: sinon.SinonSpy }
  let syncWorksheetStatusOnBuildingNegotiationStatusChangeServiceSpy
  let updateWorksheetStatusOnOwnerChangeSpy

  beforeEach(() => {
    eventSubscribers = {}
    eventBusMock = {
      on: fake((eventName, listenerName, subscriber) => {
        eventSubscribers[eventName] = subscriber
      })
    }
    releaseUserOtherActiveWorksheetsInQueueServiceMock = { release: spy() }
    updateWorksheetStatusOnOwnerChangeSpy = { updateWorksheet: spy() }
    syncWorksheetStatusOnBuildingNegotiationStatusChangeServiceSpy = { updateWorksheet: spy() }
    const noopLogger = {
      info: spy(),
      error: spy(),
      crit: spy()
    }

    const testContainer = createContainer()
    testContainer.register({
      releaseUserOtherActiveWorksheetsInQueueService: asValue(releaseUserOtherActiveWorksheetsInQueueServiceMock),
      syncWorksheetStatusOnBuildingNegotiationStatusChangeService: asValue(syncWorksheetStatusOnBuildingNegotiationStatusChangeServiceSpy),
      updateWorksheetStatusOnOwnerChangeService: asValue(updateWorksheetStatusOnOwnerChangeSpy),
      legacyWorksheetRepository: asValue(null),
      worksheetQueueActionsService: asValue(null),
      worksheetRepository: asValue(null),
      importWorksheetQueueHandler: asValue(null),
      logger: asValue(noopLogger),
      consistencyDelay: asValue(0),
      eventBus: asValue(eventBusMock)
    })
    worksheetEventListeners(eventBusMock, testContainer)
  })

  it('releases other worksheets taken by user when takes another', () => {
    expect(eventBusMock.on).to.have.been.calledWith('worksheet.taken', sinon.match.string, sinon.match.func)
    const testWorksheetTakenEvent = { queueId: 'test-queue-id', by: 'test-user-id' }

    eventSubscribers['worksheet.taken'](testWorksheetTakenEvent)

    expect(releaseUserOtherActiveWorksheetsInQueueServiceMock.release).to.have.been
      .calledWith(testWorksheetTakenEvent.by, testWorksheetTakenEvent.queueId)
  })
})
