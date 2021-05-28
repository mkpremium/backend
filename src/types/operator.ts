import t from 'tcomb'
import { RestringedHourObject } from '../operator/restringed-hours/types'

export const OperatorRoles = {
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

export const OperatorRole = t.enums.of(Object.values(OperatorRoles))
export const OperatorFirebaseStatesEnum = t.enums.of(Object.values(OperatorFirebaseStates))
export const OperatorFirebaseFeatures = t.enums.of(Object.values(OperatorFeatures))

export const OperatorProfile = t.struct(
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
    name: 'OperatorProfile',
    defaultProps: {
      state: OperatorFirebaseStates.ENABLED,
      language: 'es'
    }
  }
)

OperatorProfile.prototype.fullName = function () {
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
const OperatorSignatures = t.struct({
  user: Signature,
  city: Signature
})

export interface OperatorProfileProps {
  firstName: string;
  lastName: string;
  city: string;
  language: 'es' | 'pt';
}

export interface OperatorProps {
  id: string;
  username: string;
  password: string;
  email: string;
  profile: OperatorProfileProps;
}

export const Operator = t.struct<OperatorProps>(
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
    roles: t.list(OperatorRole),
    online: t.Boolean,

    profile: OperatorProfile,
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
    signatures: t.maybe(OperatorSignatures),
    _documentType: t.enums.of([ 'operator' ])
  },
  {
    name: 'Operator',
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

Operator.prototype.withMaxLine = function (maxLine) {
  return Operator.update(this, {
    maxLine: {
      $set: maxLine
    }
  })
}
