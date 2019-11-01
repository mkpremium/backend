import debug from 'debug';
import Promise from 'bluebird';
import _ from 'lodash';
import _get from 'lodash/get';
import _isNil from 'lodash/isNil';

import t from '../types';
import fromJSON from 'tcomb/lib/fromJSON';
import {fbComerciales} from '../index';
import {firebaseTimestampFormat, meetingDayFormat} from '../../lib/date';
import {FirebaseBuildingData, FirebaseMeeting} from '../types/business';
import {OwnerRepository} from '../../owner/models';
import {MetadataRepository} from '../../building/models';
import {ScheduledEventsRepository} from '../../scheduled-events/models';

const debugFb = debug('app:firebase:comerciales');

function arrayToObjectIds(collection) {
  const objectIds = {};
  collection.forEach(item => {
    objectIds[item.id] = true;
  });
  return objectIds;
}

function arrayToObject(collection) {
  const objects = {};
  collection.forEach(item => {
    objects[item.id] = item;
  });
  return objects;
}

export async function updateBuildingToFirebase(building, owner) {
  if (!fbComerciales.enabled) {
    return;
  }

  const db = fbComerciales.database();

  const snapshot = await db.ref(`${fbComerciales.prefixURL}Buildings/${building.id}`).once('value');
  if (snapshot.exists()) {
    return saveBuildingToFirebase(db, building, owner);
  }
}

export async function saveBuildingOwnerToFirebase(owner) {
  debugFb('saveBuildingOwnerToFirebase', 'is enable', fbComerciales.enabled);
  if (!fbComerciales.enabled) {
    return;
  }
  const db = fbComerciales.database();

  if (owner.building) {
    return saveBuildingToFirebase(db, owner.building, owner);
  }

  const snapshot = await db.ref(`${fbComerciales.prefixURL}Buildings/${owner.buildingId}`).once('value');
  if (!snapshot.exists()) {
    debugFb('saveBuildingOwnerToFirebase', `building ${owner.buildingId} doesn't exists yet`);
    return;
  }

  debugFb('saveBuildingOwnerToFirebase', `saving ${owner.id}`);
  const ownerRef = db.ref(`${fbComerciales.prefixURL}Buildings/${owner.buildingId}/Owner`);
  return ownerRef.set(owner);
}

export async function saveBuildingToFirebase_(building, owner) {
  try {
    if (!fbComerciales.enabled) {
      return;
    }

    const db = fbComerciales.database();
    await saveBuildingToFirebase(db, building, owner);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

/**
 * Finds owners related to the buildingId given which status is VERIFICADO
 * @returns {Promise<void>}
 */
async function findVerifiedOwners(buildingId) {
  const ownerRepository = new OwnerRepository();
  return ownerRepository.findAllVerifiedOwnersByBuildingId(buildingId);
}

export async function saveBuildingToFirebase(db, building, owner) {
  if (!fbComerciales.enabled) {
    debugFb('saveBuildingToFirebase', 'building omitted to save into firebase, because fbComerciales.enabled =', fbComerciales.enabled);
    return;
  }

  if (!building) {
    debugFb('saveBuildingToFirebase', 'building omitted to save into firebase, because building null');
    return;
  }

  const promises = [];
  const buildingRef = db.ref(`${fbComerciales.prefixURL}Buildings/${building.id}`);

  const saveBuildingEntity = (entity) => db
    .ref(`${fbComerciales.prefixURL}Entities/${entity.id}`)
    .update(toFirebaseEntity(entity));

  const firebaseBuilding = toFirebaseBuilding(building, owner);
  promises.push(buildingRef.child('Data').set(firebaseBuilding));

  if (owner) {
    promises.push(buildingRef.child('Owner').set(owner));
  }

  const comercialId = _get(owner, 'business.meetingWithOperatorId');

  if (comercialId) {
    const comercialBuildingRef = db.ref(`${fbComerciales.prefixURL}Users/${comercialId}/Buildings/${building.id}`);

    const metadataRepository = new MetadataRepository();
    const metadataArray = building.metadata;
    promises.push(...Promise.map(metadataArray, async(metadataBuilding) => {
      if (metadataBuilding.id) {
        const metadata = await metadataRepository.findById(metadataBuilding.id);
        if (metadata) {
          await saveMetadataToFirebase(metadata);
          if (comercialId) {
            await saveMetadataToUserBuilding(comercialId, metadata);
          }
        }
      }
    }));

    promises.push(comercialBuildingRef.child('Data').set(firebaseBuilding));
    if (owner) {
      promises.push(comercialBuildingRef.child('Owner').set(owner));
    }

    const owners = await findVerifiedOwners(building.id);
    if (owners && owners.length) {
      debugFb('saveBuildingToFirebase', 'saving verifiedOwners');
      promises.push(comercialBuildingRef.child('VerifiedOwners').set(arrayToObject(owners)));
    }
  }

  debugFb('saveBuildingToFirebase', 'saving building to', `${fbComerciales.prefixURL}Buildings/${building.id}`);

  promises.push(buildingRef.child('Entities/ids').set(arrayToObjectIds(building.entities)));
  const entityPromises = building.entities.map(saveBuildingEntity);
  const allPromises = promises.concat(entityPromises);

  if (allPromises.length > 0) {
    return Promise.all(allPromises);
  }
}

export async function removeBuildingFromBusiness(buildingId, businessId) {
  if (!fbComerciales.enabled) {
    debugFb('removeBuildingFromBusiness', 'omitted, because fbComerciales.enabled =', fbComerciales.enabled);
    return;
  }

  const db = fbComerciales.database();
  const referencePath = `${fbComerciales.prefixURL}Users/${businessId}/Buildings/${buildingId}`;
  const comercialBuildingRef = await db.ref(referencePath).once('value');
  if (comercialBuildingRef.exists()) {
    await db.ref(referencePath).set(null);
  }
}

export async function relateMeetingToBuilding(db, {id, building}) {
  if (!fbComerciales.enabled) {
    debugFb(`Relate building ${building.id} with meeting ${id} ommited because comerciales is not enabled`);
    return;
  }
  debugFb(`Relate building ${building.id} with meeting ${id}`);
  db.ref(`${fbComerciales.prefixURL}Buildings/${building.id}/Meetings/ids/${id}`).set(true);
}

export async function deleteMeetingToBuilding(db, {id, building}) {
  if (!fbComerciales.enabled) {
    return;
  }

  if (!building) {
    debugFb('deleteMeetingToBuilding', 'omitted meeting from building null');
    return;
  }

  return db.ref(`${fbComerciales.prefixURL}Buildings/${building.id}/Meetings/ids/${id}`).set(null);
}

export async function saveMeetingToFirebase(db, meeting) {
  if (!fbComerciales.enabled) {
    debugFb(`Saving meeting ${meeting.id} ommited because comerciales is not enabled`);
    return;
  }
  debugFb(`Saving meeting ${meeting.id} to firebase`);
  db.ref(`${fbComerciales.prefixURL}Meetings/${meeting.id}`).set(toFirebaseMeeting(meeting));
}

export async function deleteMeetingToFirebase(db, meeting) {
  if (!fbComerciales.enabled) {
    return;
  }
  return db.ref(`${fbComerciales.prefixURL}Meetings/${meeting.id}`).set(null);
}

export async function saveBusinessUserToFirebase(operator) {
  if (!fbComerciales.enabled) {
    return;
  }
  const db = fbComerciales.database();
  const businessOperatorRef = db.ref(`${fbComerciales.prefixURL}Users/${operator.id}`);
  const snapshot = await businessOperatorRef.once('value');

  const UserData = {
    Name: operator.profile.fullName()
  };
  const RestringedHours = operator.restringedHours || {};

  if (snapshot.exists()) {
    return Promise.all([
      businessOperatorRef.child('UserData').set(UserData),
      businessOperatorRef.child('RestringedHours').set(RestringedHours)
    ]);
  }
  return businessOperatorRef
    .set({
      Meetings: {},
      RemindersMeetings: {},
      RemindersProposes: {},
      UserData,
      RestringedHours
    });
}

export async function relateMeetingToOperator(db, meeting, operatorId) {
  if (!fbComerciales.enabled) {
    debugFb(`Relate meeting ${meeting.id} with operator ${operatorId} ommited because comerciales is not enabled`);
    return;
  }
  const meetingDay = meetingDayFormat(meeting.eventDate);
  debugFb(`Relate meeting ${meeting.id} with operator ${operatorId}`);
  return db.ref(`${fbComerciales.prefixURL}Users/${operatorId}/Meetings/Days/${meetingDay}`).update({[meeting.id]: true});
}

export async function denormalizeBuildingMeeting(operatorId, buildingId, meeting) {
  if (!fbComerciales.enabled) {
    debugFb(`Denormalize building ${operatorId} with building ${buildingId} ommited because comerciales is not enabled`);
    return;
  }
  debugFb(`Denormalize building ${operatorId} with building ${buildingId}`);
  const db = fbComerciales.database();
  const ref = db.ref(`${fbComerciales.prefixURL}Users/${operatorId}/Buildings/${buildingId}`);
  return ref.child('LastMeeting').set(toFirebaseMeeting(meeting));
}

export async function denormalizeBuildingData(operatorId, meeting) {
  if (!fbComerciales.enabled) {
    return;
  }

  const db = fbComerciales.database();
  const promises = [];
  const {building, owner} = meeting;
  const ref = db.ref(`${fbComerciales.prefixURL}Users/${operatorId}/Buildings/${building.id}`);

  const firebaseBuilding = toFirebaseBuilding(building, owner);
  promises.push(ref.child('Data').set(firebaseBuilding));

  if (owner) {
    promises.push(ref.child('Owner').set(owner));
  }

  return Promise.all(promises);
}

export async function deleteMeetingToOperator(db, meeting, operatorId) {
  if (!fbComerciales.enabled) {
    return;
  }
  const meetingDay = meetingDayFormat(meeting.eventDate);
  return db.ref(`${fbComerciales.prefixURL}Users/${operatorId}/Meetings/Days/${meetingDay}/${meeting.id}`).set(null);
}

export async function deleteMetadataFromFirebase(metadataId, buildingId) {
  if (!fbComerciales.enabled) {
    return;
  }
  const db = fbComerciales.database();
  const documentRef = db.ref(`${fbComerciales.prefixURL}Documents/${metadataId}`);
  const buildingRef = db.ref(`${fbComerciales.prefixURL}Buildings/${buildingId}/Documents/ids/${metadataId}`);

  const document = await documentRef.once('value');
  if (document.exists()) {
    await documentRef.set(null);
  }

  const building = await buildingRef.once('value');
  if (building.exists()) {
    await buildingRef.set(null);
  }
}

export async function saveMetadataToFirebase(metadata) {
  if (!fbComerciales.enabled) {
    return;
  }

  const db = fbComerciales.database();
  return Promise.all([
    db.ref(`${fbComerciales.prefixURL}Documents/${metadata.id}`).set(toFirebaseDocument(metadata)),
    db.ref(`${fbComerciales.prefixURL}Buildings/${metadata.buildingId}/Documents/ids/${metadata.id}`).set(true)
  ]);
}

export async function saveMetadataToUserBuilding(operatorId, metadata) {
  if (!fbComerciales.enabled) {
    return;
  }

  const db = fbComerciales.database();
  return db
    .ref(`${fbComerciales.prefixURL}Users/${operatorId}/Buildings/${metadata.buildingId}/Documents/${metadata.id}`)
    .set(toFirebaseDocument(metadata));
}

export async function saveNoteToFirebase(note) {
  if (!fbComerciales.enabled) {
    debugFb('saveNoteToFirebase', 'note omitted to save into firebase, because fbComerciales.enabled =', fbComerciales.enabled);
    return;
  }
  const buildingId = note.context.buildingId;

  if (!buildingId) {
    debugFb('saveNoteToFirebase', 'note omitted to save into firebase, because no buildingInd in context');
    return;
  }

  const db = fbComerciales.database();
  const noteRef = db.ref(`${fbComerciales.prefixURL}Notes/${note.id}`);
  const buildingNotesRef = db.ref(`${fbComerciales.prefixURL}Buildings/${buildingId}/Notes`);

  debugFb('saveNoteToFirebase', 'saving note to', `${fbComerciales.prefixURL}Notes/${note.id}`);

  return Promise.all([
    noteRef.set(noteWithTimestamp(note)),
    buildingNotesRef.child('LastNote').set(note.note),
    buildingNotesRef.child('ids').update({[note.id]: true})
  ]);
}

export async function businessRelatedToBuilding() {
  if (!fbComerciales.enabled) {
    return;
  }

  const db = fbComerciales.database();
  const users = await db.ref(`${fbComerciales.prefixURL}Users`).once('value');

  const businessRelatedToBuildings = {};
  _.forEach(users.val(), (user, id) => {
    Object.keys(user['Buildings'] || {}).forEach(buildingId => {
      businessRelatedToBuildings[buildingId] = id;
    });
  });

  return businessRelatedToBuildings;
}

export async function saveProposal(proposal) {
  if (!fbComerciales.enabled) {
    return;
  }

  const {buildingId} = proposal;
  const firebaseProposal = toFirebaseProposal(proposal);

  const db = fbComerciales.database();
  const proposalRef = db.ref(`${fbComerciales.prefixURL}Proposes/${proposal.id}`);
  const buildingProposalsRef = db.ref(`${fbComerciales.prefixURL}Buildings/${buildingId}/Proposes`);

  return Promise.all([
    proposalRef.set(firebaseProposal),
    buildingProposalsRef.child('ids').update({[proposal.id]: true}),
    buildingProposalsRef.child('LastPropose').set(firebaseProposal)
  ]);
}

export async function updateBuildingFirebaseProposal(building) {
  if (!fbComerciales.enabled) {
    debugFb(`Update building ${building.id} firebase proposal ommited because comerciales is not enabled`);
    return;
  }
  if (building.recentProposal) {
    debugFb(`Update building ${building.id}`);
    await updateProposalToFirebase(building.recentProposal, building);
  } else {
    debugFb(`Wont Update building ${building.id} becaause it doesn't have a proposal ${building.recentProposal}`);
  }
}

export async function updateProposalToFirebase(proposal, building) {
  const scheduleEventsRepository = new ScheduledEventsRepository();
  const meetings = await scheduleEventsRepository.findAllMeetingsByBuildingId(building.id);

  const meetingsIds = meetings.map(meeting => { return meeting.id; });
  debugFb(`Adding proposal to this meetings ${meetingsIds}`);

  const firebaseProposal = toFirebaseProposal(proposal);
  const db = fbComerciales.database();
  await Promise.all(meetings.map((meeting) => {
    return db.ref(`${fbComerciales.prefixURL}Meetings/${meeting.id}/Proposal`).set(firebaseProposal);
  }));

  debugFb(`Adding proposal to this user  ${proposal.createdBy} and building  ${building.id} `);
  if (proposal.createdBy) {
    await db.ref(`${fbComerciales.prefixURL}Users/${proposal.createdBy}/Buildings/${building.id}/LastMeeting/Proposal`)
      .set(firebaseProposal);
  }
}

export function toFirebaseProposal(proposal) {
  const lastDate = firebaseTimestampFormat(proposal.updatedAt || proposal.createdAt);
  const sendDate = firebaseTimestampFormat(proposal.createdAt);
  return t.FirebaseBuildingProposal({
    Accepted: proposal.accepted,
    Aspiration: {
      Value: proposal.aspiration,
      ReceptionDate: sendDate
    },
    LastDate: lastDate,
    SendDate: sendDate,
    Value: proposal.proposal
  });
}

function noteWithTimestamp(note) {
  const json = JSON.parse(JSON.stringify(note));
  const timestamp = firebaseTimestampFormat(note.createdAt);
  return Object.assign({}, json, {timestamp});
}

function toFirebaseMeeting(meeting) {
  return FirebaseMeeting({
    Id: meeting.id,
    Owner: meeting.owner,
    Aspiration: 0,
    Street: meeting.address,
    Email: _get(meeting, 'contact.email', ''),
    Name: _get(meeting, 'contact.name', ''),
    PhoneNumber: _get(meeting, 'contact.phone', ''),
    buildingID: _get(meeting, 'building.id', ''),
    inPerson: meeting.inPerson,
    businessOperatorId: meeting.notifyTo,
    dateCreation: firebaseTimestampFormat(meeting.createdAt),
    dateMeeting: firebaseTimestampFormat(meeting.eventDate)
  });
}

function toFirebaseBuilding(building, owner) {
  const {lat, lng} = building.location;
  let Street = _get(building, 'address.fullAddress');
  if (_isNil(Street)) {
    Street = _get(building, 'cadastre.address', '');
  }
  return FirebaseBuildingData({
    Street,
    Address: building.address,
    Cadastre: building.cadastre,
    Aspiration: 0,
    Proposal: 0,
    State: _get(owner, 'business.status', ''),
    lat,
    lng
  });
}

function toFirebaseDocument(metadata) {
  return t.FirebaseDocument({
    BuildingId: metadata.buildingId,
    DocumentName: metadata.name,
    Url: metadata.url,
    Thumbnail: metadata.previewUrl,
    mime: metadata.mimeType,
    date: firebaseTimestampFormat(metadata.createdAt)
  });
}

function toFirebaseEntity(entity) {
  return fromJSON({
    Entity: entity.name || '',
    Expiration: firebaseTimestampFormat(entity.expiration),
    Rent: entity.rent,
    Situation: entity.status,
    Surface: entity.surface || 0,
    Type: entity.type
  }, t.FirebaseBuildingEntity);
}
