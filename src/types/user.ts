import t from 'tcomb'
import { RestringedHourObject } from '../operator/restringed-hours/types'

export const UserRoles = {
  OPERATOR: 'OPERATOR',
  MANAGER: 'MANAGER',
  BUSINESS: 'BUSINESS',
  ADMIN: 'ADMIN',
  STREET: 'STREET',
  STREET_MANAGER: 'STREET_MANAGER',
  STREET_ADMIN: 'STREET_ADMIN'
}

export const OperatorFirebaseStates = {
  ENABLED: 'A',
  BLOCKED: 'B',
  PAUSED: 'P'
}

export const OperatorFeatures = {
  CHAT: 'Chat',
  STATS: 'Estadísticas',
  ALL: 'Todas'
}

export const UserRole = t.enums.of(Object.values(UserRoles))
export const OperatorFirebaseStatesEnum = t.enums.of(Object.values(OperatorFirebaseStates))
export const OperatorFirebaseFeatures = t.enums.of(Object.values(OperatorFeatures))

export const UserProfile = t.struct(
  {
    firstName: t.String,
    lastName: t.String,
    city: t.maybe(t.String),
    neighborhood: t.maybe(t.String),
    state: t.maybe(OperatorFirebaseStatesEnum),
    queueId: t.maybe(t.String),
    email: t.maybe(t.String),
    language: t.maybe(t.String)
  },
  {
    name: 'UserProfile',
    defaultProps: {
      state: OperatorFirebaseStates.ENABLED,
      language: 'es'
    }
  }
)

UserProfile.prototype.fullName = function () {
  return `${this.firstName} ${this.lastName}`.trim()
}

export const ProfitGoal = t.struct(
  {
    amount: t.Number,
    updatedAt: t.Date
  }
)

const Award = t.struct(
  {
    code: t.String,
    awardedAt: t.Date
  }
)

const Signature = t.struct({
  id: t.String,
  image: t.String, // base64 png
  description: t.String
})
const UserSignatures = t.struct({
  user: Signature,
  city: Signature
})

export interface UserProfileProps {
  firstName: string;
  lastName: string;
  city: string;
  language: 'es' | 'pt';
}

export interface UserProps {
  id: string;
  username: string;
  password: string;
  email: string;
  profile: UserProfileProps;
}

export const User = t.struct<UserProps>(
  {
    id: t.maybe(t.String),
    username: t.String,
    password: t.String,
    email: t.maybe(t.String),
    agentNumber: t.maybe(t.String),
    level: t.maybe(t.Number),
    features: t.list(OperatorFirebaseFeatures),
    serviceId: t.maybe(t.String),
    enable: t.Boolean,
    roles: t.list(UserRole),
    online: t.Boolean,

    profile: UserProfile,
    restringedHours: t.maybe(RestringedHourObject),
    flipperId: t.maybe(t.String),

    profitGoal: t.maybe(ProfitGoal),
    maxLine: t.maybe(t.Number),
    featuredOwners: t.maybe(t.list(t.struct({
      buildingId: t.String,
      ownerId: t.String
    }))),
    awards: t.list(Award),
    createdAt: t.Date,
    disabledAt: t.maybe(t.Date),
    favoriteBuildings: t.maybe(t.list(t.String)),
    signatures: t.maybe(UserSignatures),
    _documentType: t.enums.of([ 'operator' ])
  },
  {
    name: 'User',
    defaultProps: {
      enable: true,
      online: false,
      roles: [],
      features: [],
      profile: {},
      profitGoal: {
        amount: 0,
        get updatedAt () {
          return new Date()
        }
      },
      featuredOwners: [],
      favoriteBuildings: [],
      awards: [],
      get createdAt () {
        return new Date()
      },
      _documentType: 'operator'
    }
  }
)

User.prototype.withMaxLine = function (maxLine) {
  return User.update(this, {
    maxLine: {
      $set: maxLine
    }
  })
}
