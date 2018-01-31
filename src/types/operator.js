import t from 'tcomb';

t.OperatorRole = t.enums({
  OPERATOR: 'OPERATOR',
  MANAGER: 'MANAGER',
  BUSINESS: 'BUSINESS',
  ADMIN: 'MANAGER'
});

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
  city: t.maybe(t.String)
}, 'OperatorProfile');

t.OperatorProfile.prototype.fullName = function() {
  return `${this.firstName} ${this.lastName}`.trim();
};

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
  });
