import { expect } from 'chai'

import { addWorksheet, CallSchedulerService } from '../../../src/worksheet/service/call-scheduler.service'
import { createTestContainer } from '../../create-test-container'

describe('Worksheet scheduled calls', () => {
  let service: CallSchedulerService
  let repository
  let worksheetRepository

  let testWorksheetQueue
  let testWorksheet
  const testCallToSchedule = {
    id: 'test-scheduled-call-id',
    type: 'CALLS',
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
  } as any

  describe.skip('with Postgres', () => {
    beforeEach(async () => {
      await beforeEachSetup(true)
    })

    it('schedules call for worksheet in queue', async () => {
      await testAddCallToQueue()
    })

    it('schedules call and adds worksheet to queue', async () => {
      await testAddWorksheetToQueue()
    })
  })

  describe('with Couchbase', () => {
    beforeEach(async () => {
      await beforeEachSetup(false)
    })

    it('schedules call for worksheet in queue', async () => {
      await testAddCallToQueue()
    })

    it('schedules call and adds worksheet to queue', async () => {
      await testAddWorksheetToQueue()
    })
  })

  async function testAddCallToQueue() {
    const queueWithWorksheet = await repository.save(addWorksheet(testWorksheetQueue, testWorksheet))
    const scheduledCall = await service.scheduleWorksheetInQueue(queueWithWorksheet, testCallToSchedule)

    expect(scheduledCall).to.not.be.empty
  }

  async function testAddWorksheetToQueue() {
    const scheduledCall = await service.scheduleWorksheetInQueue(testWorksheetQueue, testCallToSchedule)

    expect(scheduledCall).to.not.be.empty

    const updatedQueue = await repository.get(testWorksheetQueue.id)

    expect(updatedQueue.worksheets.length).to.be.equal(1)
    expect(updatedQueue.worksheets[ 0 ].worksheetId).to.be.equal(testWorksheet.id)
  }

  async function beforeEachSetup (usePostgres: boolean) {
    const container = await createTestContainer({ couchbase: !usePostgres, postgres: usePostgres })

    repository = container.resolve('worksheetQueueRepository')
    service = container.resolve('callSchedulerService')
    worksheetRepository = container.resolve('worksheetRepository')

    testWorksheetQueue = await repository.save({
      id: 'test-worksheet-queue-id',
      name: 'test worksheet',
      worksheets: []
    })
    testWorksheet = await worksheetRepository.save({
      id: 'test-worksheet-id'
    })
  }
})
