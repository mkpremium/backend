import Promise from 'bluebird'
import debug from 'debug'
import _ from 'lodash'
import { firebaseTimestampFormat, meetingDayFormat } from '../../lib/date'
import { fbComerciales } from '../index'

import t from '../types'

const debugFb = debug('app:firebase:comerciales')

export async function removeBuildingFromBusiness (buildingId, businessId) {
}

export async function deleteMeetingToBuilding (db, { id, building }) {
  if (!fbComerciales.enabled) {
    return
  }

  if (!building) {
    debugFb('deleteMeetingToBuilding', 'omitted meeting from building null')
    return
  }

  return db.ref(`${fbComerciales.prefixURL}Buildings/${building.id}/Meetings/ids/${id}`).set(null)
}

export async function deleteMeetingToFirebase (db, meeting) {
  if (!fbComerciales.enabled) {
    return
  }
  return db.ref(`${fbComerciales.prefixURL}Meetings/${meeting.id}`).set(null)
}

export async function deleteMeetingToOperator (db, meeting, operatorId) {
  if (!fbComerciales.enabled) {
    return
  }
  const meetingDay = meetingDayFormat(meeting.eventDate)
  return db.ref(`${fbComerciales.prefixURL}Users/${operatorId}/Meetings/Days/${meetingDay}/${meeting.id}`).set(null)
}

export async function deleteMetadataFromFirebase (metadataId, buildingId) {
  if (!fbComerciales.enabled) {
    return
  }
  const db = fbComerciales.database()
  const documentRef = db.ref(`${fbComerciales.prefixURL}Documents/${metadataId}`)
  const buildingRef = db.ref(`${fbComerciales.prefixURL}Buildings/${buildingId}/Documents/ids/${metadataId}`)

  const document = await documentRef.once('value')
  if (document.exists()) {
    await documentRef.set(null)
  }

  const building = await buildingRef.once('value')
  if (building.exists()) {
    await buildingRef.set(null)
  }
}

export async function saveMetadataToFirebase (metadata) {
  if (!fbComerciales.enabled) {
    return
  }

  const db = fbComerciales.database()
  return Promise.all([
    db.ref(`${fbComerciales.prefixURL}Documents/${metadata.id}`).set(toFirebaseDocument(metadata)),
    db.ref(`${fbComerciales.prefixURL}Buildings/${metadata.buildingId}/Documents/ids/${metadata.id}`).set(true)
  ])
}

export async function saveMetadataToUserBuilding (operatorId, metadata) {
  if (!fbComerciales.enabled) {
    return
  }

  const db = fbComerciales.database()
  return db
    .ref(`${fbComerciales.prefixURL}Users/${operatorId}/Buildings/${metadata.buildingId}/Documents/${metadata.id}`)
    .set(toFirebaseDocument(metadata))
}

export async function saveNoteToFirebase (note) {
  if (!fbComerciales.enabled) {
    debugFb('saveNoteToFirebase', 'note omitted to save into firebase, because fbComerciales.enabled =', fbComerciales.enabled)
    return
  }
  const buildingId = note.context.buildingId

  if (!buildingId) {
    debugFb('saveNoteToFirebase', 'note omitted to save into firebase, because no buildingInd in context')
    return
  }

  const db = fbComerciales.database()
  const noteRef = db.ref(`${fbComerciales.prefixURL}Notes/${note.id}`)
  const buildingNotesRef = db.ref(`${fbComerciales.prefixURL}Buildings/${buildingId}/Notes`)

  debugFb('saveNoteToFirebase', 'saving note to', `${fbComerciales.prefixURL}Notes/${note.id}`)

  return Promise.all([
    noteRef.set(noteWithTimestamp(note)),
    buildingNotesRef.child('LastNote').set(note.note),
    buildingNotesRef.child('ids').update({ [ note.id ]: true })
  ])
}

export async function businessRelatedToBuilding () {
  if (!fbComerciales.enabled) {
    return
  }

  const db = fbComerciales.database()
  const users = await db.ref(`${fbComerciales.prefixURL}Users`).once('value')

  const businessRelatedToBuildings = {}
  _.forEach(users.val(), (user, id) => {
    Object.keys(user.Buildings || {}).forEach(buildingId => {
      businessRelatedToBuildings[ buildingId ] = id
    })
  })

  return businessRelatedToBuildings
}

export async function saveProposal (proposal) {
  if (!fbComerciales.enabled) {
    return
  }

  const { buildingId } = proposal
  const firebaseProposal = toFirebaseProposal(proposal)

  const db = fbComerciales.database()
  const proposalRef = db.ref(`${fbComerciales.prefixURL}Proposes/${proposal.id}`)
  const buildingProposalsRef = db.ref(`${fbComerciales.prefixURL}Buildings/${buildingId}/Proposes`)

  return Promise.all([
    proposalRef.set(firebaseProposal),
    buildingProposalsRef.child('ids').update({ [ proposal.id ]: true }),
    buildingProposalsRef.child('LastPropose').set(firebaseProposal)
  ])
}

export function toFirebaseProposal (proposal) {
  const lastDate = firebaseTimestampFormat(proposal.updatedAt || proposal.createdAt)
  const sendDate = firebaseTimestampFormat(proposal.createdAt)
  return t.FirebaseBuildingProposal({
    Accepted: proposal.accepted,
    Aspiration: {
      Value: proposal.aspiration,
      ReceptionDate: sendDate
    },
    LastDate: lastDate,
    SendDate: sendDate,
    Value: proposal.proposal
  })
}

function noteWithTimestamp (note) {
  const json = JSON.parse(JSON.stringify(note))
  const timestamp = firebaseTimestampFormat(note.createdAt)
  return Object.assign({}, json, { timestamp })
}

function toFirebaseDocument (metadata) {
  return t.FirebaseDocument({
    BuildingId: metadata.buildingId,
    DocumentName: metadata.name,
    Url: metadata.url,
    Thumbnail: metadata.previewUrl,
    mime: metadata.mimeType,
    date: firebaseTimestampFormat(metadata.createdAt)
  })
}
