import t from 'tcomb';

/**
 * @swagger
 * definitions:
 *   Credentials:
 *     required:
 *      - username
 *      - password
 *     properties:
 *      username:
 *        type: string
 *      password:
 *        type: string
 */
t.Credentials = t.struct({
  username: t.String,
  password: t.String
}, 'Credentials');
/**
 * @swagger
 * definitions:
 *   AuthenticatedResponseProfile:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *         description: ID del operador
 *       name:
 *         type: string
 *         description: Nombre complete operador
 *       username:
 *         type: string
 *   FirebaseConfig:
 *     properties:
 *       token:
 *         type: string
 *         description: Firebase token
 *       databaseURL:
 *         type: string
 *         description: Firebase database url
 *   AuthenticatedResponse:
 *     properties:
 *       token:
 *         type: string
 *         description: Bearer token
 *       operator:
 *         $ref: "#/definitions/AuthenticatedResponseProfile"
 *       roles:
 *         type: array
 *         items:
 *           type: string
 *         description: Roles que el operador tiene acceso
 *       firebase:
 *         $ref: "#/definitions/FirebaseConfig"
 */
t.AuthenticatedResponse = t.struct({
  token: t.String,
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
}, 'AuthenticatedResponse');

t.OperatorListQuery = t.ListQuery.extend({
  role: t.maybe(t.String)
});

/**
 * @swagger
 * definitions:
 *   OperatorListResponse:
 *     required:
 *       - total
 *       - results
 *     properties:
 *       total:
 *         type: number
 *       results:
 *         type: array
 *         items:
 *           $ref: "#/definitions/Operator"
 */
t.OperatorListResponse = t.struct(
  {
    total: t.Number,
    results: t.list(t.Operator)
  },
  {
    name: 'OperatorListResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
);
