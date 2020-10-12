import t from 'tcomb'
import { Operator, OperatorProfile, OperatorRole } from '../types/operator'
import { RestringedHourObject } from './restringed-hours/types'

t.Credentials = t.struct({
  username: t.String,
  password: t.String
}, 'Credentials')

t.AuthenticatedResponse = t.struct({
  refreshToken: t.String,
  token: t.String,
  access_token: t.String,
  token_type: t.String,
  operator: t.struct({
    id: t.String,
    name: t.String,
    username: t.String
  }, 'Operator'),
  firebase: t.maybe(t.struct({
    token: t.String,
    databaseURL: t.String
  }, 'firebase')),
  roles: t.list(t.String)
}, 'AuthenticatedResponse')

t.OperatorListQuery = t.ListQuery.extend({
  enable: t.maybe(t.Boolean),
  role: t.maybe(t.String)
})

t.OperatorLimitedListQuery = t.ListQuery.extend(
  {
    role: t.String,
    enable: t.maybe(t.Boolean)
  },
  {
    defaultProps: {
      role: 'BUSINESS'
    }
  }
)

export const OperatorListResponse = t.struct(
  {
    total: t.Number,
    results: t.list(Operator)
  },
  {
    name: 'OperatorListResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
)

t.OperatorView = t.struct(
  {
    id: t.maybe(t.String),
    username: t.String,
    roles: t.list(OperatorRole),
    profile: OperatorProfile,
    restringedHours: t.maybe(RestringedHourObject)
  },
  {
    name: 'Operator',
    defaultProps: {
      enable: true,
      roles: [],
      profile: {}
    }
  }
)

t.OperatorListViewResponse = t.struct(
  {
    total: t.Number,
    results: t.list(t.OperatorView)
  },
  {
    name: 'OperatorListResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
)
