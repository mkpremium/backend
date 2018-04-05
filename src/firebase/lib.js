import _get from 'lodash/get';
import firebase from './index';
import {firebaseTimestampFormat, meetingDayFormat} from '../lib/date';
import t from './types';

export async function saveBuildingToFirebase(db, building) {
  if (!firebase.enabled) {
    return;
  }
  db.ref(`Buildings/${building.id}/Data`).set(toFirebaseBuilding(building));
}

export async function relateMeetingToBuilding(db, {id, building}) {
  if (!firebase.enabled) {
    return;
  }
  db.ref(`Buildings/${building.id}/Meetings`).update({[id]: true});
}

export async function deleteMeetingToBuilding(db, {id, building}) {
  if (!firebase.enabled) {
    return;
  }
  db.ref(`Buildings/${building.id}/Meetings/${id}`).set(null);
}

export async function saveMeetingToFirebase(db, meeting) {
  if (!firebase.enabled) {
    return;
  }
  db.ref(`Meetings/${meeting.id}`).set(toFirebaseMeeting(meeting));
}

export async function deleteMeetingToFirebase(db, meeting) {
  if (!firebase.enabled) {
    return;
  }
  db.ref(`Meetings/${meeting.id}`).set(null);
}

export async function relateMeetingToOperator(db, meeting, operatorId) {
  if (!firebase.enabled) {
    return;
  }
  const meetingDay = meetingDayFormat(meeting.eventDate);
  db.ref(`Users/${operatorId}/Meetings/Days/${meetingDay}`).update({[meeting.id]: true});
}

export async function deleteMeetingToOperator(db, meeting, operatorId) {
  if (!firebase.enabled) {
    return;
  }
  const meetingDay = meetingDayFormat(meeting.eventDate);
  db.ref(`Users/${operatorId}/Meetings/Days/${meetingDay}/${meeting.id}`).set(null);
}

export async function saveMetadataToFirebase(metadata) {
  if (!firebase.enabled) {
    return;
  }
  const db = firebase.database();
  db.ref(`Documents/${metadata.id}`).set(toFirebaseDocument(metadata));
  db.ref(`Buildings/${metadata.buildingId}/Documents`).update({[metadata.id]: true});
}

export async function saveNoteToFirebase(note) {
  if (!firebase.enabled) {
    return;
  }
  const buildingId = note.context.buildingId;
  if (!buildingId) {
    return;
  }

  const db = firebase.database();
  const noteRef = db.ref(`Notes/${note.id}`);
  noteRef.set(noteWithTimestamp(note));

  const buildingNotesRef = db.ref(`Buildings/${buildingId}/Notes`);
  buildingNotesRef.child('LastNote').set(note.note);
  buildingNotesRef.child('ids').update({[note.id]: true});
}

function noteWithTimestamp(note) {
  const json = JSON.parse(JSON.stringify(note));
  const timestamp = firebaseTimestampFormat(note.createdAt);
  return Object.assign({}, json, {timestamp});
}

function toFirebaseMeeting(meeting) {
  return t.FirebaseMeeting({
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
