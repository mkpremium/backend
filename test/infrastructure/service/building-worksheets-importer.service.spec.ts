import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'

import { BuildingWorkSheetsImporterService  } from '../../../src/infrastructure/service/building-worksheets-importer.service'
import { CouchbaseDocument, CouchbaseDocumentType } from '../../../src/infrastructure/postgres/couchbase-document.entity'
import { buildingBuilder } from '../../building/building.builder'
import { Building } from '../../../src/building/building.entity'
import { Caller } from '../../../src/caller/caller.entity'
import { User } from '../../../src/user/user.entity'
import { Worksheet } from '../../../src/worksheet/worksheet.entity'
import { WorksheetQueue } from '../../../src/worksheet/worksheet-queue.entity'
import { callerFactory } from '../../../test/factories'

import { v4 as uuid } from 'uuid'
import { EntityManager } from 'typeorm'
import { QueueSource } from '../../../src/worksheet/domain/queue'

// export class CouchbaseProposalsRepository extends CouchbaseRepository<ProposalProps> implements ProposalsRepository {

describe('BuildingWorkSheetsImporterService', () => {
  it('persists proposals', async () => {
    const testContainer = await createTestContainer({ postgres: true, couchbase: false })

    const service = testContainer.resolve('buildingWorkSheetsImporterService') as BuildingWorkSheetsImporterService
    const em = testContainer.resolve('entityManager') as EntityManager
    const buildingId = await populateDB(em)

    await service.importWorkSheets(buildingId)

    // Assert that the worksheet was created.
    const ws = await em.findOneBy(Worksheet, [
      { building: { id: buildingId } },
    ])
    expect(ws).to.be.not.null
  })
})

async function populateDB(em: EntityManager): Promise<string> {
  const buildingId = uuid()
  const queueId = uuid()
  const worksheetId = uuid()
  const userId = uuid()

  const worksheet = {
    status: "OPENED",
    addedAt: "2021-09-16T07:00:46.719Z",
    operatorId: userId,
    worksheetId: worksheetId,
  }

  // Create the parent building.
  await em.save(Building, {
    ...buildingBuilder({ id: buildingId }).build(),
  })

  await em.save(User,
    {id: userId, username: "test", password: "test", enabled: true, profile: {}})

  // Create the caller using operatorId as the userId.
  await em.save(Caller, {
    user: {id: userId},
  })

  await em.save(WorksheetQueue, {
    id: queueId,
    name: "test",
    source: {} as QueueSource,
  })

  await em.save(CouchbaseDocument, {
    id: queueId,
    documentType: CouchbaseDocumentType.WORKSHEET_QUEUE,
    document: {
      worksheets: [
        worksheet,
      ],
    }
  })

  await em.save(CouchbaseDocument, {
    id: worksheetId,
    documentType: CouchbaseDocumentType.WORKSHEET,
    document: {
      id: worksheetId,
      relatedBuildingIds: [buildingId],
      queueId: queueId,
    },
  })

  return buildingId
}
