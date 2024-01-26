import { resolveDependencies } from "../../helpers"
import { buildingFactory } from "../../factories";
import type { importOwnerHandlerFactory } from "../../../src/owner/service/import-owner-command-handler";
import { ownerBuilder } from "../../owner/owner.builder";
import { EntityManager } from "typeorm";
import {
  CouchbaseDocument,
  CouchbaseDocumentType
} from "../../../src/infrastructure/postgres/couchbase-document.entity";
import uuid from "uuid/v4";

describe('importOwnerCommandHandler', () => {
  it('imports contact with ID reported from callcenter', async () => {
    const deps = await resolveDependencies()
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())

    const importer: ReturnType<typeof importOwnerHandlerFactory> = deps.container.resolve('importOwnerCommandHandler')

    const builder = ownerBuilder({buildingId: testBuilding.id})
    const testCouchbaseOwner = builder.withPhoneContact('phone-reported-from-callcenter').build()
    const entityManager = deps.container.resolve('entityManager') as EntityManager
    await entityManager.save(CouchbaseDocument, {
      documentType: CouchbaseDocumentType.OWNER,
      document: testCouchbaseOwner,
      id: testCouchbaseOwner.id,
    })

    await importer({owner: testCouchbaseOwner})
  })

  it('imports owner with duplicated contact', async () => {
    const deps = await resolveDependencies()
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())

    const importer: ReturnType<typeof importOwnerHandlerFactory> = deps.container.resolve('importOwnerCommandHandler')

    const builder = ownerBuilder({buildingId: testBuilding.id})
    const testCouchbaseOwner = builder.withPhoneContact(uuid(), 'UNDEFINED', '666666666')
      .withPhoneContact(uuid(), 'UNDEFINED', '666666666')
        .build()
    const entityManager = deps.container.resolve('entityManager') as EntityManager
    await entityManager.save(CouchbaseDocument, {
      documentType: CouchbaseDocumentType.OWNER,
      document: testCouchbaseOwner,
      id: testCouchbaseOwner.id,
    })

    await importer({owner: testCouchbaseOwner})
  })
})
