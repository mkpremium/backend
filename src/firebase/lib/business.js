import Promise from 'bluebird'
import { firebaseTimestampFormat } from '../../lib/date'
import { fbComerciales } from '../index'

import t from '../types'

export async function removeBuildingFromBusiness (buildingId, businessId) {
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
