import {expect} from 'chai';
import {BuildingProposalRepository, BuildingRepository} from '../../src/building/models';
import t from 'tcomb';
import {OperatorRepository} from '../../src/operator/models';
import {operatorCreate} from '../common';
import {ScheduledEventsRepository} from '../../src/scheduled-events/models';
import {updateProposalsOnScheduleEventsBuilding} from '../../src/building/application';
import {ScheduledEventType} from '../../src/scheduled-events/types';
import {OwnerStatus, OwnerType} from '../../src/types/enums';
import {WorksheetRepository} from '../../src/worksheet/models/worksheet';
import {OwnerRepository} from '../../src/owner/models';

describe('Schedule event update propoposal', () => {
  let testOwner;
  let testBuilding;
  let testOperator;
  let testScheduledEvent;

  const operatorRepository = new OperatorRepository();
  const buildingRepository = new BuildingRepository();
  const proposalRepository = new BuildingProposalRepository();
  const scheduleEventsRepository = new ScheduledEventsRepository();
  const ownerRepository = new OwnerRepository();

  before(async() => {
    await operatorRepository.deleteQuery();
    await buildingRepository.deleteQuery();
    await proposalRepository.deleteQuery();
    await scheduleEventsRepository.deleteQuery();

    testOperator = await operatorCreate('1');

    const buildingMock = {
      'address': {
        'city': 'MADRID',
        'fullAddress': 'PZ TIRSO DE MOLINA 8 MADRID',
        'number': '8',
        'postalCode': {
          'number': '28012'
        },
        'province': 'MADRID',
        'street': 'TIRSO DE MOLINA',
        'type': 'PZ'
      },
      'buildingDate': '1900',
      'cadastre': {
        'address': 'PZ TIRSO DE MOLINA 8 28012 MADRID (MADRID)',
        'reference': '0339101VK4703G0001WK'
      },
      'coefficient': '100,000000',
      'elements': {
        'average': 291.1,
        'commons': 341,
        'number': 10
      },
      'entities': [
        {
          'door': 'DR',
          'plant': '00',
          'surface': 282,
          'type': 'COMERCIO'
        }
      ],
      'floorArea': '2911',
      'propertyType': 'UR',
      'use': 'Residencial',
      'location': {
        'lat': 11,
        'lng': 12
      },
      proposals: [],
      recentProposal: null,
      _migrateId: '1235'
    };
    testBuilding = await BuildingRepository.createNewBuilding(buildingMock);


    const testWorksheet = await WorksheetRepository.createNewForBuilding(testBuilding);
    let ownerBody = {
      buildingId: testBuilding.id,
      type: OwnerType.PRINCIPAL,
      verified: true,
      status: OwnerStatus.VERIFIED,
      person: {
        id: '123456',
        name: 'Charlie',
        contacts: [],
        addresses: [],
        personType: 'NATURAL',
        _documentType: 'person'
      },
      personId: null,
      note: null,
      business: null
    };
    testOwner = await ownerRepository.createOwnerAndPerson(ownerBody);

    let params = {
      createdBy: testOperator.id,
      notifyTo: testOperator.id,
      building: testBuilding,
      event: {
        ownerId: testOwner.id,
        buildingId: testBuilding.id,
        worksheetId: testWorksheet.id,
        eventAddress: testBuilding.address.fullAddress,
        eventLocation: {
          lat: 0,
          long: 0
        },
        inPerson: true
      },
      notifyAt: new Date('2018-02-28T16:00:00Z'),
      eventDate: new Date('2018-02-29T16:30:00Z')
    };

    testScheduledEvent = await scheduleEventsRepository.addScheduledMeetingEvent(params, testOperator.id);
  });

  it('Should update proposals building property on related schedule-event', async() => {
    const newProposalMock = {
      ownerId: testOwner.id,
      buildingId: testBuilding.id,
      accepted: false,
      createdAt: new Date(),
      createdBy: testOperator.id,
      proposal: 2000,
      state: 'pendiente',
      aspiration: -1
    };
    const newProposal = await proposalRepository.save(newProposalMock, false);

  });
});
