import t from 'tcomb'
import uuid from 'uuid/v4'
import { TypeContact } from './enums'

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
const PostalCode = t.struct(
  {
    number: t.maybe(t.union([t.String, t.Number])),
    verified: t.Boolean
  },
  {
    name: 'PostalCode',
    defaultProps: {
      verified: false
    }
  }
)

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
export const SimpleAddress = t.SimpleAddress = t.struct({
  fullAddress: t.maybe(t.String),
  floor: t.maybe(t.String),
  number: t.maybe(t.String),
  city: t.maybe(t.String),
  postalCode: t.maybe(t.String)
}, 'SimpleAddress')

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
export const SimplePhoneNumber = t.SimplePhoneNumber = t.struct(
  {
    number: t.String,
    note: t.String
  },
  {
    name: 'SimplePhoneNumber'
  }
)

export const ContactInfoStatus = t.TypedContactInfoStatus = t.enums({
  UNDEFINED: 'UNDEFINED',
  GOOD: 'GOOD',
  BAD: 'BAD'
})

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
export const TypedContactInfo = t.TypedContactInfo = t.struct(
  {
    id: t.String,
    type: TypeContact,
    value: t.String,
    note: t.maybe(t.String),
    status: t.TypedContactInfoStatus
  },
  {
    name: 'TypedContactInfo',
    defaultProps: {
      get id () {
        return uuid()
      },
      type: 'TELEFONO',
      status: 'UNDEFINED',
      note: null
    }
  }
)

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
    type: t.maybe(TypeContact),
    value: t.maybe(t.String),
    note: t.maybe(t.String),
    status: t.maybe(t.TypedContactInfoStatus)
  },
  {
    name: 'TypedContactInfoUpdate'
  }
)

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
export const Address = t.Address = t.struct(
  {
    type: t.maybe(t.String),
    street: t.String,
    number: t.union([t.Number, t.String]),
    fullAddress: t.maybe(t.String),
    registerNumber: t.maybe(t.Number),
    postalCode: PostalCode,
    city: t.String,
    province: t.maybe(t.String),
    zone: t.maybe(t.String),
    neighborhood: t.maybe(t.String)
  },
  {
    name: 'Address',
    defaultProps: {
      zone: '',
      neighborhood: '',
      province: ''
    }
  }
)
