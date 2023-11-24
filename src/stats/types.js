import t from 'tcomb'
import uuid from 'uuid/v4'

export const OperatorActions = {
  // Operator
  CALL: 'call',
  CALL_ANSWERED: 'call_answered',
  VERIFIED_OWNER: 'verified_owner',
  MEETING: 'meeting',
  SCHEDULE_CALL: 'schedule_call',
  VIEW_WORKSHEET: 'view_worksheet',
  NON_PRESENTIAL_MEETING: 'non_presential_meeting',
  // Business
  PROPOSAL_SENT: 'proposal_sent',
  BUSINESS_MEETING: 'business_meeting'
}

t.OperatorActions = t.enums.of(Object.values(OperatorActions))

t.OperatorStats = t.struct(
  {
    id: t.String,
    operatorId: t.String,
    action: t.OperatorActions,
    createdAt: t.Date,
    // Filters
    city: t.maybe(t.String),
    province: t.maybe(t.union([t.String, t.list(t.String)])),
    _documentType: t.enums.of(['operator-stats'])
  },
  {
    name: 'OperatorStats',
    defaultProps: {
      get id () {
        return uuid()
      },
      get createdAt () {
        return new Date()
      },
      _documentType: 'operator-stats'
    }
  }
)

t.OperatorPerformace = t.struct(
  {
    id: t.String,
    operatorId: t.String,
    daily_mean: t.Number,
    average_last_two_weeks: t.Number,
    createdAt: t.Date,

    _documentType: t.enums.of(['operator-stats-performance'])
  },
  {
    name: 'OperatorStats',
    defaultProps: {
      get id () {
        return uuid()
      },
      get createdAt () {
        return new Date()
      },
      _documentType: 'operator-stats-performance'
    }
  }
)

export default t
