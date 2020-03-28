import t from 'tcomb'
import uuid from 'uuid/v4'
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

/**
 * @swagger
 * definitions:
 *   OperatorProfile:
 *     properties:
 *       firstName:
 *         type: string
 *       lastName:
 *         type: string
 *       city:
 *         type: array
 *         items:
 *           type: string
 *       neighborhood:
 *         type: string
 *       state:
 *         type: string
 *         description: Estado en Firebase [A P B]
 *       queueId:
 *         type: string
 *         description: Id de la cola al cual ha sido asignado el operador
 *     required:
 *       - firstName
 *       - lastName
 */
t.OperatorProfile = t.struct(
  {
    firstName: t.String,
    lastName: t.String,
    city: t.maybe(t.String),
    neighborhood: t.maybe(t.String),
    state: t.maybe(OperatorFirebaseStatesEnum),
    queueId: t.maybe(t.String),
    email: t.maybe(t.String)
  },
  {
    name: 'OperatorProfile',
    defaultProps: {
      state: OperatorFirebaseStates.ENABLED
    }
  }
)

t.OperatorProfile.prototype.fullName = function () {
  return `${this.firstName} ${this.lastName}`.trim()
}

t.OperatorProfile.prototype.getStateMessage = function () {
  switch (this.state) {
    case OperatorFirebaseStates.BLOCKED:
      return 'bloqueado'
    case OperatorFirebaseStates.ENABLED:
      return 'activo'
    case OperatorFirebaseStates.PAUSED:
      return 'en pausa'
    default:
      return 'error de estado'
  }
}

export const ProfitGoal = t.struct(
  {
    amount: t.Number,
    updatedAt: t.Date
  }
)

export const Award = t.Award = t.struct(
  {
    code: t.String,
    awardedAt: t.Date
  }
)

/**
 * @swagger
 * definitions:
 *  OperatorBody:
 *    required:
 *      - username
 *      - password
 *      - agentNumber
 *      - roles
 *      - profile
 *    properties:
 *      username:
 *        type: string
 *      password:
 *        type: string
 *      email:
 *        type: string
 *        description: Email para uso en firebase
 *      agentNumber:
 *        type: string
 *        description: "Numero de Agente en Firebase, código y extension en call center"
 *      enable:
 *        type: boolean
 *      profile:
 *        $ref: "#/definitions/OperatorProfile"
 *      roles:
 *        type: array
 *        items:
 *          type: string
 *      level:
 *        type: number
 *        description: Nivel en Firebase
 *      features:
 *        type: array
 *        items:
 *          type: string
 *        description: "Funciones o Permisos en Firebase"
 */

/**
 * @swagger
 * definitions:
 *  Operator:
 *    required:
 *      - username
 *      - password
 *      - agentNumber
 *      - roles
 *    properties:
 *      id:
 *        type: string
 *        format: uuid/v4
 *      username:
 *        type: string
 *      email:
 *        type: string
 *        description: Email para uso en firebase
 *      password:
 *        type: string
 *      agentNumber:
 *        type: string
 *        description: "Numero de Agente en Firebase, código y extension en call center"
 *      level:
 *        type: number
 *        description: Nivel en Firebase
 *      enable:
 *        type: boolean
 *      profile:
 *        $ref: "#/definitions/OperatorProfile"
 *      roles:
 *        type: array
 *        items:
 *          type: string
 *      restringedHours:
 *        $ref: "#/definitions/RestringedHours"
 *      features:
 *        type: array
 *        items:
 *          type: string
 *        description: "Funciones o Permisos en Firebase"
 *      createdAt:
 *        type: string
 *      disabledAt:
 *        type: string
 */
export const Operator = t.struct(
  {
    id: t.maybe(t.String),
    username: t.String,
    password: t.String,
    email: t.maybe(t.String),
    agentNumber: t.maybe(t.String),
    level: t.maybe(t.Number),
    features: t.list(OperatorFirebaseFeatures),
    serviceId: t.maybe(t.String),
    enable: t.Bool,
    roles: t.list(OperatorRole),
    online: t.Bool,

    profile: t.OperatorProfile,
    restringedHours: t.maybe(RestringedHourObject),

    profitGoal: t.maybe(ProfitGoal),
    featuredOwners: t.maybe(t.list(t.struct({
      buildingId: t.String,
      ownerId: t.String
    }))),
    awards: t.list(Award),
    createdAt: t.Date,
    disabledAt: t.maybe(t.Date),
    favoriteBuildings: t.maybe(t.list(t.String)),
    _documentType: t.enums.of(['operator'])
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

t.OperatorProfileUpdate = t.struct({
  firstName: t.maybe(t.String),
  lastName: t.maybe(t.String),
  city: t.maybe(t.String),
  neighborhood: t.maybe(t.String),
  state: t.maybe(OperatorFirebaseStatesEnum),
  queueId: t.maybe(t.String),
  email: t.maybe(t.String)
})

t.OperatorRefreshToken = t.struct(
  {
    id: t.String,
    operatorId: t.String,
    refreshToken: t.String,
    _documentType: t.enums.of(['operator-refresh_token'])
  },
  {
    name: 'OperatorRefreshToken',
    defaultProps: {
      get id () {
        return uuid()
      },
      _documentType: 'operator-refresh_token'
    }
  }
)
