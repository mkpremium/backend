import t from 'tcomb'
import moment from 'moment'

export const DateTimeString = t.refinement(t.String, s => moment(s, true).isValid())
