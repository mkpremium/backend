import { addCaller, createOwnerWithPhoneContact, ResolvedDeps, resolveDependencies } from "../../helpers"
import { buildingFactory } from "../../factories";
import { EntityManager } from "typeorm";
import {
  CouchbaseDocument,
  CouchbaseDocumentType
} from "../../../src/infrastructure/postgres/couchbase-document.entity";
import { BuildingProps } from "../../../src/building/building";
import { expect } from "chai";
import { Owner } from "../../../src/owner/owner.entity";
import { OwnerProps } from "../../../src/owner/owner";
import { ImportScheduledEventHandler } from "../../../src/scheduled-events/service/scheduled-event-importer.service";
import uuid from "uuid/v4";
import { ScheduledEvent } from "../../../src/scheduled-events/scheduled-event.entity";

type ScheduledEventArg = Parameters<ImportScheduledEventHandler>[0]['scheduledEvent'];

describe('importOwnerCommandHandler', () => {
  let deps: ResolvedDeps;
  let testBuilding: BuildingProps;
  let importer: ImportScheduledEventHandler;
  let entityManager: EntityManager;

  beforeEach(async () => {
    deps = await resolveDependencies();
    testBuilding = await deps.buildingsRepository.save(buildingFactory.build());
    importer = deps.container.resolve('importScheduledEventCommandHandler');
    entityManager = deps.container.resolve('entityManager') as EntityManager;
  });

  it('imports scheduled calls', async () => {
    const testScheduledEventId = uuid()
    const [testOwner, testPhoneContact] = await createOwnerWithPhoneContact(testBuilding, deps)
    const testCallerUser = await addCaller(deps)

    const testScheduledCall = {
      id: testScheduledEventId,
      type: 'CALLS' as const,
      event: {
        ownerId: testOwner.id,
        inPerson: true,
        contactId: testPhoneContact.id,
        buildingId: null,
        worksheetId: 'eecdce1a-b5c2-4dac-8303-ce91c5f16e99',
      },
      notifyAt: '2019-10-07T10:00:00.000Z',
      notifyTo: testCallerUser.id,
      createdAt: '2019-10-01T10:11:30.820Z',
      createdBy: testCallerUser.id,
      eventDate: '2019-10-07T10:00:00.000Z',
    }
    await saveScheduledEventCouchbaseDocument(testScheduledCall);

    await importer({scheduledEvent: testScheduledCall})

    await assertOwnerSaved(testScheduledCall)
  });

  it.skip('imports meetings', async () => {
  });

  it.skip('imports offer requests')

  async function assertOwnerSaved(scheduledEvent: ScheduledEventArg) {
    const savedScheduledEvent = await entityManager.findOneBy(ScheduledEvent, {id: scheduledEvent.id});
    expect(savedScheduledEvent).to.include({id: scheduledEvent.id})
  }


  async function saveScheduledEventCouchbaseDocument(scheduledEvent: ScheduledEventArg) {
    await entityManager.save(CouchbaseDocument, {
      documentType: CouchbaseDocumentType.SCHEDULED_EVENT,
      document: scheduledEvent,
      id: scheduledEvent.id,
    });
  }
});
