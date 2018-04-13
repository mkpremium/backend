import t from 'tcomb';

export const OperatorRoles = {
  OPERATOR: 'OPERATOR',
  MANAGER: 'MANAGER',
  BUSINESS: 'BUSINESS',
  ADMIN: 'ADMIN',
  STREET: 'STREET'
};

export const OperatorFirebaseStates = {
  ENABLED: 'A',
  BLOCKED: 'B',
  PAUSED: 'P'
};

t.OperatorRole = t.enums.of(Object.values(OperatorRoles));
t.OperatorFirebaseStates = t.enums.of(Object.values(OperatorFirebaseStates));

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
 *    properties:
 *      username:
 *        type: string
 *      password:
 *        type: string
 *      agentNumber:
 *        type: string
 *      enable:
 *        type: boolean
 *      profile:
 *        $ref: "#/definitions/OperatorProfile"
 *      roles:
 *        type: array
 *        items:
 *          type: string
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
 *      password:
 *        type: string
 *      agentNumber:
 *        type: string
 *      enable:
 *        type: boolean
 *      profile:
 *        $ref: "#/definitions/OperatorProfile"
 *      roles:
 *        type: array
 *        items:
 *          type: string
 */
t.Operator = t.struct(
  {
    id: t.maybe(t.String),
    username: t.String,
    password: t.String,
    agentNumber: t.maybe(t.String),
    serviceId: t.maybe(t.String),
    enable: t.Bool,
    roles: t.list(t.OperatorRole),

    profile: t.OperatorProfile,

    _documentType: t.String
  },
  {
    name: 'Operator',
    defaultProps: {
      enable: true,
      roles: [],
      profile: {},
      _documentType: 'operator'
    }
  }
);
