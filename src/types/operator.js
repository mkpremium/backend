import t from 'tcomb';

export const OperatorRoles = {
  OPERATOR: 'OPERATOR',
  MANAGER: 'MANAGER',
  BUSINESS: 'BUSINESS',
  ADMIN: 'ADMIN',
  STREET: 'STREET',
  STREET_MANAGER: 'STREET_MANAGER'
};

export const OperatorFirebaseStates = {
  ENABLED: 'A',
  BLOCKED: 'B',
  PAUSED: 'P'
};

export const OperatorFeatures = {
  CHAT: 'Chat',
  STATS: 'Estadísticas',
  ALL: 'Todas'
};

t.OperatorRole = t.enums.of(Object.values(OperatorRoles));
t.OperatorFirebaseStates = t.enums.of(Object.values(OperatorFirebaseStates));
t.OperatorFirebaseFeatures = t.enums.of(Object.values(OperatorFeatures));

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
 *         type: string
 *       neighborhood:
 *         type: string
 *       state:
 *         type: string
 *         description: Estado en Firebase [A P B]
 *     required:
 *       - firstName
 *       - lastName
 */
t.OperatorProfile = t.struct({
  firstName: t.String,
  lastName: t.String,
  city: t.maybe(t.String),
  neighborhood: t.maybe(t.String),
  state: t.maybe(t.OperatorFirebaseStates)
}, 'OperatorProfile');

t.OperatorProfile.prototype.fullName = function() {
  return `${this.firstName} ${this.lastName}`.trim();
};

t.OperatorProfile.prototype.getStateMessage = function() {
  switch (this.state) {
    case OperatorFirebaseStates.BLOCKED:
      return 'bloqueado';
    case OperatorFirebaseStates.ENABLED:
      return 'activo';
    case OperatorFirebaseStates.PAUSED:
      return 'en pausa';
    default:
      return 'error de estado';
  }
};

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
 *        type: Number
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
 *        type: Number
 *        description: Nivel en Firebase
 *      enable:
 *        type: boolean
 *      profile:
 *        $ref: "#/definitions/OperatorProfile"
 *      roles:
 *        type: array
 *        items:
 *          type: string
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
t.Operator = t.struct(
  {
    id: t.maybe(t.String),
    username: t.String,
    password: t.String,
    email: t.maybe(t.String),
    agentNumber: t.maybe(t.String),
    level: t.maybe(t.Number),
    features: t.list(t.OperatorFirebaseFeatures),
    serviceId: t.maybe(t.String),
    enable: t.Bool,
    roles: t.list(t.OperatorRole),

    profile: t.OperatorProfile,

    createdAt: t.Date,
    disabledAt: t.maybe(t.Date),
    _documentType: t.String
  },
  {
    name: 'Operator',
    defaultProps: {
      enable: true,
      roles: [],
      features: [],
      profile: {},
      get createdAt() {
        return new Date();
      },
      _documentType: 'operator'
    }
  }
);
