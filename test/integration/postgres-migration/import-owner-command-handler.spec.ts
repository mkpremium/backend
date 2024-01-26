import { ResolvedDeps, resolveDependencies } from "../../helpers"
import { buildingFactory } from "../../factories";
import type { importOwnerHandlerFactory } from "../../../src/owner/service/import-owner-command-handler";
import { ownerBuilder } from "../../owner/owner.builder";
import { EntityManager } from "typeorm";
import {
  CouchbaseDocument,
  CouchbaseDocumentType
} from "../../../src/infrastructure/postgres/couchbase-document.entity";
import uuid from "uuid/v4";
import { BuildingProps } from "../../../src/building/building";
import { expect } from "chai";
import { Owner } from "../../../src/owner/owner.entity";
import { OwnerProps } from "../../../src/owner/owner";

describe('importOwnerCommandHandler', () => {
  let deps: ResolvedDeps;
  let testBuilding: BuildingProps;
  let importer: ReturnType<typeof importOwnerHandlerFactory>;
  let testOwnerBuilder: ReturnType<typeof ownerBuilder>;
  let entityManager: EntityManager;

  beforeEach(async () => {
    deps = await resolveDependencies();
    testBuilding = await deps.buildingsRepository.save(buildingFactory.build());
    importer = deps.container.resolve('importOwnerCommandHandler');
    testOwnerBuilder = ownerBuilder({buildingId: testBuilding.id});
    entityManager = deps.container.resolve('entityManager') as EntityManager;
  });

  it('imports contact with ID reported from callcenter', async () => {
    const testCouchbaseOwner = testOwnerBuilder.withPhoneContact('phone-reported-from-callcenter').build();
    await saveOwnerCouchbaseDocument(testCouchbaseOwner);

    await importer({owner: testCouchbaseOwner});

    await assertOwnerSaved(testCouchbaseOwner);
  });

  it('imports owner with duplicated contact', async () => {
    const testCouchbaseOwner = testOwnerBuilder.withPhoneContact(uuid(), 'UNDEFINED', '666666666')
      .withPhoneContact(uuid(), 'UNDEFINED', '666666666')
      .build();
    await saveOwnerCouchbaseDocument(testCouchbaseOwner);

    await importer({owner: testCouchbaseOwner});

    await assertOwnerSaved(testCouchbaseOwner)
  });

  it('saves featured contact', async () => {
    const testCouchbaseOwner = testOwnerBuilder.withPhoneContact('phone-reported-from-callcenter')
      .withFeaturedPhone('phone-reported-from-callcenter')
      .build();
    await saveOwnerCouchbaseDocument(testCouchbaseOwner);

    await importer({owner: testCouchbaseOwner});

    const owner = await entityManager.findOne(Owner, {
      where: {id: testCouchbaseOwner.id},
      relations: {
        person: {
          featuredPhoneContact: true,
          contacts: {
            contact: true
          }
        }
      }
    })
    const savedContact = owner.person.contacts[0].contact
    expect(owner.person.featuredPhoneContact.id).to.be.equal(savedContact.id)
  });

  async function assertOwnerSaved(owner: OwnerProps) {
    const savedOwner = await entityManager.findOneBy(Owner, {id: owner.id});
    expect(savedOwner).to.include({id: owner.id})
  }


  async function saveOwnerCouchbaseDocument(owner: OwnerProps) {
    await entityManager.save(CouchbaseDocument, {
      documentType: CouchbaseDocumentType.OWNER,
      document: owner,
      id: owner.id,
    });
  }
});
