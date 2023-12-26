import { expect } from 'chai'

import { addWorksheet, CallSchedulerService } from '../../../src/worksheet/service/call-scheduler.service'
import { createTestContainer } from '../../create-test-container'
import uuid from 'uuid/v4'
import { buildingBuilder } from '../../building/building.builder'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'

describe('Worksheet scheduled calls', () => {
  let service: CallSchedulerService
  let queuesRepository
  let worksheetRepository

  let testWorksheetQueue
  let testWorksheet
  const testWorksheetId = uuid()
  const testCallToSchedule = {
    id: uuid(),
    type: 'CALLS',
    createdBy: 'test-user-id',
    notifyTo: 'test-user-id',
    event:
      {

        buildingId: uuid(),
        contactId: uuid(),
        worksheetId: testWorksheetId,
        ownerId: uuid(),
      },
    notifyAt: '2020-11-14T08:00:00.000Z',
    eventDate: '2020-11-14T08:00:00.000Z'
  } as any

  describe('with Postgres', () => {
    beforeEach(async () => {
      await beforeEachSetup(true)
    })

    it('schedules call for worksheet in queue', async () => {
      await testAddCallToQueue()
    })

    it.skip('schedules call and adds worksheet to queue', async () => {
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
    const queueWithWorksheet = await queuesRepository.save(addWorksheet(testWorksheetQueue, testWorksheet))
    const scheduledCall = await service.scheduleWorksheetInQueue(queueWithWorksheet, testCallToSchedule)

    expect(scheduledCall).to.not.be.empty
  }

  async function testAddWorksheetToQueue() {
    const scheduledCall = await service.scheduleWorksheetInQueue(testWorksheetQueue, testCallToSchedule)

    expect(scheduledCall).to.not.be.empty

    const updatedQueue = await queuesRepository.get(testWorksheetQueue.id)

    expect(updatedQueue.worksheets.length).to.be.equal(1)
    expect(updatedQueue.worksheets[ 0 ].worksheetId).to.be.equal(testWorksheet.id)
  }

  async function beforeEachSetup (usePostgres: boolean) {
    const container = await createTestContainer({ couchbase: !usePostgres, postgres: usePostgres })

    queuesRepository = container.resolve('worksheetQueueRepository')
    service = container.resolve('callSchedulerService')
    worksheetRepository = container.resolve('worksheetRepository')
    const buildingsRepository = container.resolve('buildingsRepository') as BuildingsRepository
    const testBuilding = await buildingsRepository.save(buildingBuilder({}).build())


    testWorksheet = await worksheetRepository.save({
      id: testWorksheetId,
      relatedBuildingIds: [ testBuilding.id ],
    })
    testWorksheetQueue = await queuesRepository.save({
      name: 'test worksheet queue',
      worksheets: []
    })
  }
})
