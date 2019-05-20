import t from 'tcomb';
import {RestringedHourObject} from './restringed-hours/types';

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
}, 'AuthenticatedResponse');

t.OperatorListQuery = t.ListQuery.extend({
  enable: t.maybe(t.Boolean),
  role: t.maybe(t.String)
});

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
);

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

/**
 * @swagger
 * definitions:
 *  OperatorView:
 *    properties:
 *      id:
 *        type: string
 *        format: uuid/v4
 *      username:
 *        type: string
 *      profile:
 *        $ref: "#/definitions/OperatorProfile"
 *      roles:
 *        type: array
 *        items:
 *          type: string
 */
t.OperatorView = t.struct(
  {
    id: t.maybe(t.String),
    username: t.String,
    roles: t.list(t.OperatorRole),
    profile: t.OperatorProfile,
    restringedHours: RestringedHourObject
  },
  {
    name: 'Operator',
    defaultProps: {
      enable: true,
      roles: [],
      profile: {}
    }
  }
);

/**
 * @swagger
 * definitions:
 *   OperatorListViewResponse:
 *     required:
 *       - total
 *       - results
 *     properties:
 *       total:
 *         type: number
 *       results:
 *         type: array
 *         items:
 *           $ref: "#/definitions/OperatorView"
 */
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
);
