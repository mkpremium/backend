import t from 'tcomb'
import { User, UserProfile, UserRole } from '../types/user'
import { ListQuery } from '../types/params'
import { RestringedHourObject } from './restringed-hours/types'

t.Credentials = t.struct({
  username: t.String,
  password: t.String
}, 'Credentials')

export const AuthenticatedResponse = t.struct({
  token: t.String,
  access_token: t.String,
  token_type: t.String,
  operator: t.struct({
    id: t.String,
    name: t.String,
    username: t.String
  }, 'Operator'),
  roles: t.list(t.String)
}, 'AuthenticatedResponse')

t.OperatorListQuery = ListQuery.extend({
  enable: t.maybe(t.Boolean),
  role: t.maybe(t.String)
})

t.OperatorLimitedListQuery = ListQuery.extend(
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
    results: t.list(User)
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
    roles: t.list(UserRole),
    profile: UserProfile,
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
