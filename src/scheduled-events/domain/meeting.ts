import t from 'tcomb'
import moment, { isMoment } from 'moment'

const MomentType = t.irreducible('MomentType', x => isMoment(x))
export interface Meeting {
  id: string,
  buildingId: string,
  withAgentOfId: string,
  meetingAt: moment.Moment
}
export const Meeting = t.struct<Meeting>({
  id: t.String,
  buildingId: t.String,
  withAgentOfId: t.String,
  meetingAt: MomentType
})
