import { addCaller, createOwnerWithPhoneContact, ResolvedDeps, resolveDependencies } from "../../helpers"
import { buildingFactory, userFactory } from "../../factories";
import { EntityManager } from "typeorm";
import {
  CouchbaseDocument,
  CouchbaseDocumentType
} from "../../../src/infrastructure/postgres/couchbase-document.entity";
import { BuildingProps } from "../../../src/building/building";
import { expect } from "chai";
import { ImportScheduledEventHandler } from "../../../src/scheduled-events/service/scheduled-event-importer.service";
import uuid from "uuid/v4";
import { ScheduledEvent } from "../../../src/scheduled-events/scheduled-event.entity";
import { ContactProps, OwnerProps } from "../../../src/owner/owner";
import { UserProps } from "../../../src/types/user";
import { BuildingOfferRequest } from "../../../src/building/repository/building-offer-request.entity";
import { ownerBuilder } from "../../owner/owner.builder";

type ScheduledEventArg = Parameters<ImportScheduledEventHandler>[0]['scheduledEvent'];

describe('importScheduledEventHandler', () => {
  let deps: ResolvedDeps;
  let testBuilding: BuildingProps;
  let importer: ImportScheduledEventHandler;
  let entityManager: EntityManager;
  let testOwner: OwnerProps
  let testPhoneContact: ContactProps & { isFeatured: boolean }
  let testCallerUser: UserProps & { callerId?: string; flipperId?: string };

  beforeEach(async () => {
    deps = await resolveDependencies();
    testBuilding = await deps.buildingsRepository.save(buildingFactory.build());
    importer = deps.container.resolve('importScheduledEventCommandHandler');
    entityManager = deps.container.resolve('entityManager') as EntityManager;

    [testOwner, testPhoneContact] = await createOwnerWithPhoneContact(testBuilding, deps);
    testCallerUser = await addCaller(deps);

    const testCouchbaseOwner = ownerBuilder({id: testOwner.id, buildingId: testBuilding.id})
      .withPhoneContact('phone-reported-from-callcenter', 'UNDEFINED', testPhoneContact.value)
      .build();
    await entityManager.save(CouchbaseDocument, {
      documentType: CouchbaseDocumentType.OWNER,
      document: testCouchbaseOwner,
      id: testCouchbaseOwner.id,
    });
  });

  it('imports scheduled calls', async () => {
    const testScheduledCall = {
      id: uuid(),
      type: 'CALLS' as const,
      event: {
        ownerId: testOwner.id,
        inPerson: true,
        contactId: 'phone-reported-from-callcenter',
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

    await assertScheduledEventSavedFor(testScheduledCall)
  });

  it('imports meetings', async () => {
    const testMeeting = {
      id: uuid(),
      type: 'MEETINGS' as const,
      event: {
        ownerId: testOwner.id,
        inPerson: true,
        contactId: 'phone-reported-from-callcenter',
        buildingId: '',
      },
      notifyTo: testCallerUser.id,
      createdAt: '2021-09-16T12:00:34.091Z',
      createdBy: testCallerUser.id,
      eventDate: '2021-09-16T12:00:34.091Z',
    }

    await saveScheduledEventCouchbaseDocument(testMeeting);

    await importer({scheduledEvent: testMeeting})

    await assertScheduledEventSavedFor(testMeeting)
  });

  it('imports offer requests', async () => {
    const testFlipper = await deps.addFlipperService.addFlipper(userFactory.build())
    const testOfferRequest = {
      id: uuid(),
      type: 'MEETINGS' as const,
      event: {
        ownerId: testOwner.id,
        inPerson: false,
        contactId: 'phone-reported-from-callcenter',
        buildingId: '',
      },
      notifyAt: '2019-05-09T14:30:00.000Z',
      notifyTo: testFlipper.user.id,
      createdAt: '2019-05-06T14:48:00.845Z',
      createdBy: testCallerUser.id,
      eventDate: '2019-05-09T14:30:00.000Z'
    }
    await saveScheduledEventCouchbaseDocument(testOfferRequest);

    await importer({scheduledEvent: testOfferRequest})

    const savedOfferRequest = await entityManager.findOneBy(BuildingOfferRequest, {id: testOfferRequest.id})

    expect(savedOfferRequest).to.be.ok
  })
  async function assertScheduledEventSavedFor(scheduledEvent: ScheduledEventArg) {
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
