import { initApplication } from '../../../test-e2e/helper/rest-api-helper'
import { expect } from 'chai'

describe('WorksheetQueueRepository', () => {
  let app
  let repository
  let worksheetRepository

  beforeEach(async () => {
    app = await initApplication()
    repository = app.locals.legacyDependenciesContainer.worksheetQueueRepository
    worksheetRepository = app.locals.dependenciesContainer.worksheetRepository
  })

  describe('scheduleWorksheetInQueue', () => {
    it('schedules call for worksheet in queue', async () => {
      const testWorksheetQueue = await repository.save({
        id: 'test-worksheet-queue-id',
        name: 'test worksheet',
        worksheets: []
      })
      const savedWorksheet = await worksheetRepository.save({
        id: 'test-worksheet-id'
      })

      const updatedQueue = await repository.save(testWorksheetQueue.addWorksheet(savedWorksheet))

      const scheduledCall = await repository.scheduleWorksheetInQueue(updatedQueue, {
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
      })

      expect(scheduledCall).to.not.be.empty
    })
  })
})
