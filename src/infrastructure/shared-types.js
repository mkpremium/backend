import t from 'tcomb'
import moment from 'moment'

export const DateTimeString = t.refinement(t.String, s => moment(s, 'YYYY-MM-DD[T]HH:mm:ss.SSSZ', true).isValid())
