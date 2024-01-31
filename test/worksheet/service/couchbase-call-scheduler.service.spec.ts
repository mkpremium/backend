import { expect } from 'chai'

import {
  addWorksheet,
  CouchbaseCallSchedulerService
} from '../../../src/worksheet/service/couchbase-call-scheduler.service'
import { createTestContainer } from '../../create-test-container'
import uuid from 'uuid/v4'
import { buildingBuilder } from '../../building/building.builder'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { worksheetQueueFactory } from '../../factories'
import { WorksheetQueueRepository } from '../../../src/worksheet/repository/worksheet-queue.repository'
import { QueueItemStatus } from '../../../src/worksheet/models/queue-item'

describe('CouchbaseCallSchedulerService', () => {
  let service: CouchbaseCallSchedulerService
  let queuesRepository: WorksheetQueueRepository
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
        ownerId: uuid()
      },
    notifyAt: '2020-11-14T08:00:00.000Z',
    eventDate: '2020-11-14T08:00:00.000Z'
  } as any

  beforeEach(beforeEachSetup)

  it('schedules call for worksheet in queue', async () => {
    const queueWithWorksheet = await queuesRepository.save(addWorksheet(testWorksheetQueue, testWorksheet))
    const scheduledCall = await service.scheduleWorksheetInQueue(queueWithWorksheet, testCallToSchedule)
    expect(scheduledCall).to.not.be.empty
  })

  it('schedules call and adds worksheet to queue', async () => {
    const scheduledCall = await service.scheduleWorksheetInQueue(testWorksheetQueue, testCallToSchedule)

    expect(scheduledCall).to.not.be.empty

    const updatedQueue = await queuesRepository.get(testWorksheetQueue.id)

    expect(updatedQueue.worksheets.length).to.be.equal(1)
    expect(updatedQueue.worksheets[0].worksheetId).to.be.equal(testWorksheet.id)
    expect(updatedQueue.worksheets[0]).to.include({ status: QueueItemStatus.SCHEDULED })
  })

  async function beforeEachSetup () {
    const container = await createTestContainer({ couchbase: true, postgres: false })

    queuesRepository = container.resolve('worksheetQueueRepository')
    service = container.resolve('couchbaseCallSchedulerService')
    worksheetRepository = container.resolve('worksheetRepository')
    const buildingsRepository = container.resolve('buildingsRepository') as BuildingsRepository
    const testBuilding = await buildingsRepository.save(buildingBuilder({}).build())

    testWorksheet = await worksheetRepository.save({
      id: testWorksheetId,
      relatedBuildingIds: [testBuilding.id]
    })
    testWorksheetQueue = await queuesRepository.save(worksheetQueueFactory.build())
  }
})
