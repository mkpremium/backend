import t from 'tcomb'
import { isMoment } from 'moment'

const MomentType = t.irreducible('MomentType', x => isMoment(x))
export const Meeting = t.struct({
  id: t.String,
  buildingId: t.String,
  withAgentOfId: t.String,
  meetingAt: MomentType
})
