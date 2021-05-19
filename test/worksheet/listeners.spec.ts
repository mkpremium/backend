import { expect } from 'chai'
import sinon, { fake, spy } from 'sinon'
import { asValue, createContainer } from 'awilix'
import { worksheetEventListeners } from '../../src/worksheet/listeners'
import Sinon from 'sinon'

describe('worksheetEventListeners', () => {
  let eventBusMock: { on: Sinon.SinonSpy }
  let releaseUserOtherActiveWorksheetsInQueueServiceMock: { release: Sinon.SinonSpy }
  let eventSubscribers

  beforeEach(() => {
    eventSubscribers = {}
    eventBusMock = {
      on: fake((eventName, subscriber) => {
        eventSubscribers[eventName] = subscriber
      })
    }
    releaseUserOtherActiveWorksheetsInQueueServiceMock = { release: spy() }

    const testContainer = createContainer()
    testContainer.register({
      eventBus: asValue(eventBusMock),
      releaseUserOtherActiveWorksheetsInQueueService: asValue(releaseUserOtherActiveWorksheetsInQueueServiceMock),
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
})
