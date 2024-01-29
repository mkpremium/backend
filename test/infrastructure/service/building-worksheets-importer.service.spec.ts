import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'

import {
  BuildingWorkSheetsImporterService
} from '../../../src/infrastructure/service/building-worksheets-importer.service'
import {
  CouchbaseDocument,
  CouchbaseDocumentType
} from '../../../src/infrastructure/postgres/couchbase-document.entity'
import { buildingBuilder } from '../../building/building.builder'
import { Building } from '../../../src/building/building.entity'
import { Caller } from '../../../src/caller/caller.entity'
import { User } from '../../../src/user/user.entity'
import { Worksheet } from '../../../src/worksheet/worksheet.entity'
import { WorksheetQueue } from '../../../src/worksheet/worksheet-queue.entity'

import { v4 as uuid } from 'uuid'
import { EntityManager } from 'typeorm'
import { QueueSource } from '../../../src/worksheet/domain/queue'
import { addCaller, ResolvedDeps, resolveDependencies } from "../../helpers";
import { buildingFactory, worksheetQueueFactory } from "../../factories";
import { worksheetBuilder } from "../../worksheet/worksheet.builder";

describe('BuildingWorkSheetsImporterService', () => {
  it('persists proposals', async () => {
    const [testBuildingId, deps] = await populateDB()

    const service = deps.container.resolve('buildingWorkSheetsImporterService') as BuildingWorkSheetsImporterService
    await service.importWorkSheet(testBuildingId)

    const em = deps.container.resolve('entityManager') as EntityManager
    // Assert that the worksheet was created.
    const ws = await em.findOneBy(Worksheet, [
      {building: {id: testBuildingId}},
    ])
    expect(ws).to.be.not.null
  })
})

async function populateDB(): Promise<[string, ResolvedDeps]> {
  const deps = await resolveDependencies()
  const em = deps.container.resolve('entityManager') as EntityManager

  const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
  const testCaller = await addCaller(deps)
  const testCouchbaseWorksheet = worksheetBuilder({id: uuid()}).build()
  const testCouchbaseWorksheetQueueItem = {
    status: "OPENED",
    addedAt: "2021-09-16T07:00:46.719Z",
    operatorId: testCaller.id,
    worksheetId: testCouchbaseWorksheet.id,
  }
  const testQueue = await deps.postgresQueueRepository.save(worksheetQueueFactory.build())

  await em.save(CouchbaseDocument, {
    id: testQueue.id,
    documentType: CouchbaseDocumentType.WORKSHEET_QUEUE,
    document: {
      worksheets: [testCouchbaseWorksheetQueueItem],
    }
  })

  await em.save(CouchbaseDocument, {
    id: testCouchbaseWorksheet.id,
    documentType: CouchbaseDocumentType.WORKSHEET,
    document: {
      id: testCouchbaseWorksheet.id,
      relatedBuildingIds: [testBuilding.id],
      queueId: testQueue.id,
    },
  })

  return [testBuilding.id, deps]
}
