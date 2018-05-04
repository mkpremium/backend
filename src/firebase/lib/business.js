import Promise from 'bluebird';
import _get from 'lodash/get';
import t from '../types';
import {fbComerciales} from '../index';
import {firebaseTimestampFormat, meetingDayFormat} from '../../lib/date';

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

  const snapshot = await db.ref(`Buildings/${building.id}`).once('value');
  if (snapshot.exists()) {
    return saveBuildingToFirebase(db, building, owner);
  }
}

export async function saveBuildingToFirebase(db, building, owner) {
  if (!fbComerciales.enabled) {
    return;
  }
  const buildingRef = db.ref(`Buildings/${building.id}`);

  const saveBuildingEntity = (entity) => {
    db.ref(`Entities/${entity.id}`).update(toFirebaseEntity(entity));
  };

  buildingRef.child('Data').set(toFirebaseBuilding(building));
  if (owner) {
    buildingRef.child('Owner').set(owner);
  }

  buildingRef.child('Entities/ids').set(arrayToObjectIds(building.entities));
  building.entities.forEach(saveBuildingEntity);
}

export async function relateMeetingToBuilding(db, {id, building}) {
  if (!fbComerciales.enabled) {
    return;
  }
  db.ref(`Buildings/${building.id}/Meetings/ids/${id}`).set(true);
}

export async function deleteMeetingToBuilding(db, {id, building}) {
  if (!fbComerciales.enabled) {
    return;
  }
  db.ref(`Buildings/${building.id}/Meetings/ids/${id}`).set(null);
}

export async function saveMeetingToFirebase(db, meeting) {
  if (!fbComerciales.enabled) {
    return;
  }
  db.ref(`Meetings/${meeting.id}`).set(toFirebaseMeeting(meeting));
}

export async function deleteMeetingToFirebase(db, meeting) {
  if (!fbComerciales.enabled) {
    return;
  }
  return db.ref(`Meetings/${meeting.id}`).set(null);
}

export async function saveBusinessUserToFirebase(operator) {
  if (!fbComerciales.enabled) {
    return;
  }
  const db = fbComerciales.database();
  return db.ref(`Users/${operator.id}`).set({
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
  return db.ref(`Users/${operatorId}/Meetings/Days/${meetingDay}`).update({[meeting.id]: true});
}

export async function deleteMeetingToOperator(db, meeting, operatorId) {
  if (!fbComerciales.enabled) {
    return;
  }
  const meetingDay = meetingDayFormat(meeting.eventDate);
  return db.ref(`Users/${operatorId}/Meetings/Days/${meetingDay}/${meeting.id}`).set(null);
}

export async function saveMetadataToFirebase(metadata) {
  if (!fbComerciales.enabled) {
    return;
  }
  const db = fbComerciales.database();
  return Promise.all([
    db.ref(`Documents/${metadata.id}`).set(toFirebaseDocument(metadata)),
    db.ref(`Buildings/${metadata.buildingId}/Documents/ids/${metadata.id}`).set(true)
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
  const noteRef = db.ref(`Notes/${note.id}`);

  const buildingNotesRef = db.ref(`Buildings/${buildingId}/Notes`);

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
  const timestamp = firebaseTimestampFormat(proposal.updatedAt || proposal.createdAt);
  return t.FirebaseBuildingProposal({
    Accepted: proposal.accepted,
    Aspiration: {
      Value: proposal.aspiration,
      ReceptionDate: timestamp
    },
    LastDate: timestamp,
    SendDate: timestamp,
    Value: proposal.proposal
  });
}

function noteWithTimestamp(note) {
  const json = JSON.parse(JSON.stringify(note));
  const timestamp = firebaseTimestampFormat(note.createdAt);
  return Object.assign({}, json, {timestamp});
}

function toFirebaseMeeting(meeting) {
  return t.FirebaseMeeting({
    Owner: meeting.owner,
    Aspiration: 0,
    Street: meeting.address,
    Email: _get(meeting, 'contact.email', ''),
    Name: _get(meeting, 'contact.name', ''),
    PhoneNumber: _get(meeting, 'contact.phone', ''),
    buildingID: _get(meeting, 'building.id', ''),
    dateCreation: firebaseTimestampFormat(meeting.createdAt),
    dateMeeting: firebaseTimestampFormat(meeting.eventDate)
  });
}

function toFirebaseBuilding(building) {
  const {lat, lng} = building.location;
  return t.FirebaseBuildingData({
    Street: _get(building, 'address.fullAddress'),
    Aspiration: 0,
    Proposal: 0,
    State: '',
    lat,
    lng
  });
}

function toFirebaseDocument(metadata) {
  return t.FirebaseDocument({
    DocumentName: metadata.name,
    Url: metadata.url,
    Thumbnail: metadata.previewUrl,
    date: firebaseTimestampFormat(metadata.createdAt)
  });
}

function toFirebaseEntity(entity) {
  return t.FirebaseBuildingEntity({
    Entity: entity.name,
    Expiration: firebaseTimestampFormat(entity.expiration),
    Rent: entity.rent,
    Situation: entity.status,
    Surface: entity.surface,
    Type: entity.type
  });
}
