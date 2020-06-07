import Promise from 'bluebird'
import debug from 'debug'
import { firebaseTimestampFormat } from '../../lib/date'
import { fbComerciales } from '../index'

import t from '../types'

const debugFb = debug('app:firebase:comerciales')

export async function removeBuildingFromBusiness (buildingId, businessId) {
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
