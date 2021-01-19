import { initApplication } from '../../../test-e2e/helper/rest-api-helper'
import { expect } from 'chai'

describe('WorksheetQueueRepository', () => {
  let app
  let repository
  let worksheetRepository

  beforeEach(async () => {
    app = await initApplication()
    repository = app.locals.diContainer.resolve('legacyWorksheetQueueRepository')
    worksheetRepository = app.locals.diContainer.resolve('worksheetRepository')
  })

  describe('scheduleWorksheetInQueue', () => {
    let testWorksheetQueue
    let testWorksheet
    const testCallToSchedule = {
      createdBy: 'test-user-id',
      notifyTo: 'test-user-id',
      event:
        {

          buildingId: 'test-building-id',
          contactId: 'test-contact-id',
          worksheetId: 'test-worksheet-id',
          ownerId: 'test-owner-id'
        },
      notifyAt: '2020-11-14T08:00:00.000Z',
      eventDate: '2020-11-14T08:00:00.000Z'
    }

    beforeEach(async () => {
      testWorksheetQueue = await repository.save({
        id: 'test-worksheet-queue-id',
        name: 'test worksheet',
        worksheets: []
      })
      testWorksheet = await worksheetRepository.save({
        id: 'test-worksheet-id'
      })
    })

    it('schedules call for worksheet in queue', async () => {
      const queueWithWorksheet = await repository.save(testWorksheetQueue.addWorksheet(testWorksheet))
      const scheduledCall = await repository.scheduleWorksheetInQueue(queueWithWorksheet, testCallToSchedule)

      expect(scheduledCall).to.not.be.empty
    })

    it('schedules call and adds worksheet to queue', async () => {
      const scheduledCall = await repository.scheduleWorksheetInQueue(testWorksheetQueue, testCallToSchedule)

      expect(scheduledCall).to.not.be.empty

      const updatedQueue = await repository.findById(testWorksheetQueue.id)

      expect(updatedQueue.worksheets.length).to.be.equal(1)
      expect(updatedQueue.worksheets[ 0 ].worksheetId).to.be.equal(testWorksheet.id)
    })
  })
})
