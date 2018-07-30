import debug from 'debug';
import Promise from 'bluebird';
import _get from 'lodash/get';
import mime from 'mime-types';
import t from '../types';
import fromJSON from 'tcomb/lib/fromJSON';
import {fbComerciales} from '../index';
import {firebaseTimestampFormat, meetingDayFormat} from '../../lib/date';
import {FirebaseBuildingData, FirebaseMeeting} from '../types/business';

const debugFb = debug('app:firebase:comerciales');

function arrayToObjectIds(collection) {
  const objectIds = {};
  collection.forEach(item => {
    objectIds[item.id] = true;
  });
  return objectIds;
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

export async function saveBuildingToFirebase(db, building, owner) {
  if (!fbComerciales.enabled) {
    return;
  }
  const buildingRef = db.ref(`${fbComerciales.prefixURL}Buildings/${building.id}`);

  const saveBuildingEntity = (entity) => {
    db.ref(`${fbComerciales.prefixURL}Entities/${entity.id}`).update(toFirebaseEntity(entity));
  };

  const firebaseBuilding = toFirebaseBuilding(building, owner);
  buildingRef.child('Data').set(firebaseBuilding);
  buildingRef.child('Owner').set(owner);

  const comercialId = _get(owner, 'business.meetingWithOperatorId');

  if (comercialId) {
    const comercialBuildingRef = db.ref(`Users/${comercialId}/Buildings/${building.id}`);
    comercialBuildingRef.child('Data').set(firebaseBuilding);
    comercialBuildingRef.child('Owner').set(owner);
  }

  buildingRef.child('Entities/ids').set(arrayToObjectIds(building.entities));
  building.entities.forEach(saveBuildingEntity);
}

export async function relateMeetingToBuilding(db, {id, building}) {
  if (!fbComerciales.enabled) {
    return;
  }
  db.ref(`${fbComerciales.prefixURL}Buildings/${building.id}/Meetings/ids/${id}`).set(true);
}

export async function deleteMeetingToBuilding(db, {id, building}) {
  if (!fbComerciales.enabled) {
    return;
  }
  db.ref(`${fbComerciales.prefixURL}Buildings/${building.id}/Meetings/ids/${id}`).set(null);
}

export async function saveMeetingToFirebase(db, meeting) {
  if (!fbComerciales.enabled) {
    return;
  }
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
  if (snapshot.exists()) {
    return businessOperatorRef
      .child('UserData').set({
        Name: operator.profile.fullName()
      });
  }
  return businessOperatorRef
    .set({
      Meetings: {},
      RemindersMeetings: {},
      RemindersProposes: {},
      UserData: {
        Name: operator.profile.fullName()
      }
    });
}

export async function relateMeetingToOperator(db, meeting, operatorId) {
  if (!fbComerciales.enabled) {
    return;
  }
  const meetingDay = meetingDayFormat(meeting.eventDate);
  return db.ref(`${fbComerciales.prefixURL}Users/${operatorId}/Meetings/Days/${meetingDay}`).update({[meeting.id]: true});
}

export async function deleteMeetingToOperator(db, meeting, operatorId) {
  if (!fbComerciales.enabled) {
    return;
  }
  const meetingDay = meetingDayFormat(meeting.eventDate);
  return db.ref(`${fbComerciales.prefixURL}Users/${operatorId}/Meetings/Days/${meetingDay}/${meeting.id}`).set(null);
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

export async function saveNoteToFirebase(note) {
  if (!fbComerciales.enabled) {
    return;
  }
  const buildingId = note.context.buildingId;
  if (!buildingId) {
    return;
  }

  const db = fbComerciales.database();
  const noteRef = db.ref(`${fbComerciales.prefixURL}Notes/${note.id}`);

  const buildingNotesRef = db.ref(`${fbComerciales.prefixURL}Buildings/${buildingId}/Notes`);

  return Promise.all([
    noteRef.set(noteWithTimestamp(note)),
    buildingNotesRef.child('LastNote').set(note.note),
    buildingNotesRef.child('ids').update({[note.id]: true})
  ]);
}

export async function saveProposal(proposal) {
  if (!fbComerciales.enabled) {
    return;
  }

  const {buildingId} = proposal;
  const firebaseProposal = toFirebaseProposal(proposal);

  const db = fbComerciales.database();
  const proposalRef = db.ref(`Proposes/${proposal.id}`);
  const buildingProposalsRef = db.ref(`Buildings/${buildingId}/Proposes`);

  return Promise.all([
    proposalRef.set(firebaseProposal),
    buildingProposalsRef.child('ids').update({[proposal.id]: true}),
    buildingProposalsRef.child('LastPropose').set(firebaseProposal)
  ]);
}

function toFirebaseProposal(proposal) {
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
  return FirebaseBuildingData({
    Street: _get(building, 'address.fullAddress'),
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
    DocumentName: metadata.name,
    Url: metadata.url,
    Thumbnail: metadata.previewUrl,
    mime: mime.lookup(metadata.previewUrl),
    date: firebaseTimestampFormat(metadata.createdAt)
  });
}

function toFirebaseEntity(entity) {
  return fromJSON({
    Entity: entity.name,
    Expiration: firebaseTimestampFormat(entity.expiration),
    Rent: entity.rent,
    Situation: entity.status,
    Surface: entity.surface,
    Type: entity.type
  }, t.FirebaseBuildingEntity);
}
