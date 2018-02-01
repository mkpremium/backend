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
 */
t.AuthenticatedResponse = t.struct({
  token: t.String,
  operator: t.struct({
    id: t.String,
    name: t.String,
    username: t.String
  }, 'Operator'),
  roles: t.list(t.String)
}, 'AuthenticatedResponse');
