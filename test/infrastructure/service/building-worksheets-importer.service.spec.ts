import { expect } from 'chai'

import {
  BuildingWorkSheetsImporterService
} from '../../../src/infrastructure/service/building-worksheets-importer.service'
import {
  CouchbaseDocument,
  CouchbaseDocumentType
} from '../../../src/infrastructure/postgres/couchbase-document.entity'
import { Worksheet } from '../../../src/worksheet/worksheet.entity'
import { EntityManager } from 'typeorm'
import { addCaller, ResolvedDeps, resolveDependencies } from "../../helpers";
import { buildingFactory, worksheetFactory, worksheetQueueFactory } from "../../factories";

describe('BuildingWorkSheetsImporterService', () => {
  it('imports worksheets with queue and operator', async () => {
    const [testBuildingId, deps] = await populateDB({withQueueAssigned: true})

    const service = deps.container.resolve('buildingWorkSheetsImporterService') as BuildingWorkSheetsImporterService
    await service.importWorkSheet(testBuildingId)

    const em = deps.container.resolve('entityManager') as EntityManager
    // Assert that the worksheet was created.
    const ws = await em.findOneBy(Worksheet, [
      {building: {id: testBuildingId}},
    ])
    expect(ws).to.be.ok
  })

  it('imports worksheets without a queue assigned', async () => {
    const [testBuildingId, deps] = await populateDB({withQueueAssigned: false})

    const service = deps.container.resolve('buildingWorkSheetsImporterService') as BuildingWorkSheetsImporterService
    await service.importWorkSheet(testBuildingId)

    const em = deps.container.resolve('entityManager') as EntityManager
    // Assert that the worksheet was created.
    const ws = await em.findOneBy(Worksheet, [
      {building: {id: testBuildingId}},
    ])
    expect(ws).to.be.ok
  })
})

async function populateDB({withQueueAssigned}: {withQueueAssigned: boolean}): Promise<[string, ResolvedDeps]> {
  const deps = await resolveDependencies()
  const em = deps.container.resolve('entityManager') as EntityManager

  const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
  const testCouchbaseWorksheet = worksheetFactory.build(null, {buildingId: testBuilding.id})

  if (withQueueAssigned) {
    const testCaller = await addCaller(deps)
    const testCouchbaseWorksheetQueueItem = {
      status: "OPENED",
      addedAt: "2021-09-16T07:00:46.719Z",
      operatorId: testCaller.id,
      worksheetId: testCouchbaseWorksheet.id,
    }
    const testQueue = await deps.postgresQueueRepository.save(worksheetQueueFactory.build())
    testCouchbaseWorksheet.queueId = testQueue.id

    await em.save(CouchbaseDocument, {
      id: testQueue.id,
      documentType: CouchbaseDocumentType.WORKSHEET_QUEUE,
      document: {
        worksheets: [testCouchbaseWorksheetQueueItem],
      }
    })
  }

  await em.save(CouchbaseDocument, {
    id: testCouchbaseWorksheet.id,
    documentType: CouchbaseDocumentType.WORKSHEET,
    document: testCouchbaseWorksheet,
  })

  return [testBuilding.id, deps]
}
