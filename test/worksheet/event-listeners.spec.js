import { setupEventListeners } from '../../src/worksheet/event-listeners'
import { expect } from 'chai'
import sinon, { fake, spy } from 'sinon'

describe('setupEventListeners', () => {
  it('releases other worksheets taken by user when takes another', () => {
    const eventSubscribers = {}
    const eventBusMock = {
      on: fake((eventName, subscriber) => {
        eventSubscribers[ eventName ] = subscriber
      })
    }
    const releaseUserOtherActiveWorksheetsInQueueServiceMock = {
      release: spy()
    }

    setupEventListeners(
      eventBusMock, { releaseUserOtherActiveWorksheetsInQueueService: releaseUserOtherActiveWorksheetsInQueueServiceMock }
    )

    expect(eventBusMock.on).to.have.been.calledWith('worksheet.taken', sinon.match.func)
    const worksheetTakenEvent = { worksheetId: 'test-worksheet-id', queueId: 'test-queue-id', by: 'test-user-id' }
    eventSubscribers[ 'worksheet.taken' ](worksheetTakenEvent)
    expect(releaseUserOtherActiveWorksheetsInQueueServiceMock.release).to.have.been
      .calledWith(worksheetTakenEvent.by, worksheetTakenEvent.queueId, worksheetTakenEvent.worksheetId)
  })
})
