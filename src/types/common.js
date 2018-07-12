import t from 'tcomb';
import uuid from 'uuid/v4';

/**
 * @swagger
 * definitions:
 *   PostalCode:
 *     properties:
 *       number:
 *         type: number
 *       verified:
 *         type: boolean
 */
t.PostalCode = t.struct(
  {
    number: t.maybe(t.String),
    verified: t.Boolean
  },
  {
    name: 'PostalCode',
    defaultProps: {
      verified: false
    }
  }
);

/**
 * @swagger
 * definitions:
 *   SimpleAddress:
 *     properties:
 *       fullAddress:
 *         type: string
 *       city:
 *         type: string
 */
t.SimpleAddress = t.struct({
  fullAddress: t.String,
  city: t.String
}, 'SimpleAddress');

/**
 * @swagger
 * definitions:
 *   SimplePhoneNumber:
 *     properties:
 *       number:
 *         type: string
 *       note:
 *         type: string
 */
t.SimplePhoneNumber = t.struct(
  {
    number: t.String,
    note: t.String
  },
  {
    name: 'SimplePhoneNumber'
  }
);

t.TypedContactInfoStatus = t.enums({
  UNDEFINED: 'UNDEFINED',
  GOOD: 'GOOD',
  BAD: 'BAD'
});

/**
 * @swagger
 * definitions:
 *   TypedContactInfoBody:
 *     required:
 *       - type
 *       - status
 *       - value
 *     properties:
 *       type:
 *         type: string
 *         enum: [TELEFONO, FAX, MOVIL, EMAIL, SITIO_WEB]
 *       value:
 *         type: string
 *       note:
 *         type: string
 *       status:
 *         type: string
 *         enum: [UNDEFINED, GOOD, BAD]
 */

/**
 * @swagger
 * definitions:
 *   TypedContactInfo:
 *     required:
 *       - type
 *       - status
 *       - value
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       type:
 *         type: string
 *         enum: [TELEFONO, FAX, MOVIL, EMAIL, SITIO_WEB]
 *       value:
 *         type: string
 *       note:
 *         type: string
 *       status:
 *         type: string
 *         enum: [UNDEFINED, GOOD, BAD]
 */
t.TypedContactInfo = t.struct(
  {
    id: t.String,
    type: t.TypeContact,
    value: t.String,
    note: t.maybe(t.String),
    status: t.TypedContactInfoStatus
  },
  {
    name: 'TypedContactInfo',
    defaultProps: {
      get id() {
        return uuid();
      },
      type: 'TELEFONO',
      status: 'UNDEFINED'
    }
  }
);

/**
 * @swagger
 * definitions:
 *   TypedContactInfoUpdate:
 *     properties:
 *       type:
 *         type: string
 *         enum: [TELEFONO, FAX, MOVIL, EMAIL, SITIO_WEB]
 *       value:
 *         type: string
 *       note:
 *         type: string
 *       status:
 *         type: string
 *         enum: [UNDEFINED, GOOD, BAD]
 */
t.TypedContactInfoUpdate = t.struct(
  {
    type: t.maybe(t.TypeContact),
    value: t.maybe(t.String),
    note: t.maybe(t.String),
    status: t.maybe(t.TypedContactInfoStatus)
  },
  {
    name: 'TypedContactInfoUpdate'
  }
);

/**
 * @swagger
 * definitions:
 *   Address:
 *     properties:
 *       type:
 *         type: string
 *       street:
 *         type: string
 *       number:
 *         type: number
 *       fullAddress:
 *         type: string
 *       registerNumber:
 *         type: number
 *       postalCode:
 *         $ref: "#/definitions/PostalCode"
 *       city:
 *         type: string
 *       province:
 *         type: string
 *       zone:
 *         type: string
 */
t.Address = t.struct(
  {
    type: t.String,
    street: t.String,
    number: t.Number,
    fullAddress: t.maybe(t.String),
    registerNumber: t.Number,
    postalCode: t.PostalCode,
    city: t.String,
    province: t.String,
    zone: t.String,
    neighborhood: t.String
  },
  {
    name: 'Address'
  }
);
