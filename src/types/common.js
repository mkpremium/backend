import t from 'tcomb'
import uuid from 'uuid/v4'
import { TypeContact } from './enums'

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

export const SimpleAddress = t.SimpleAddress = t.struct({
  fullAddress: t.maybe(t.String),
  floor: t.maybe(t.String),
  number: t.maybe(t.String),
  city: t.maybe(t.String),
  postalCode: t.maybe(t.String)
}, 'SimpleAddress')

export const SimplePhoneNumber = t.SimplePhoneNumber = t.struct(
  {
    number: t.String,
    note: t.String
  },
  {
    name: 'SimplePhoneNumber'
  }
)

export const ContactInfoStatus = t.enums({
  UNDEFINED: 'UNDEFINED',
  GOOD: 'GOOD',
  BAD: 'BAD'
})

export const TypedContactInfo = t.struct(
  {
    id: t.String,
    type: TypeContact,
    value: t.String,
    note: t.maybe(t.String),
    status: ContactInfoStatus
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

t.TypedContactInfoUpdate = t.struct(
  {
    type: t.maybe(TypeContact),
    value: t.maybe(t.String),
    note: t.maybe(t.String),
    status: t.maybe(ContactInfoStatus)
  },
  {
    name: 'TypedContactInfoUpdate'
  }
)

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
