import t from 'tcomb'

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

export const SimpleAddress = t.struct({
  fullAddress: t.maybe(t.String),
  floor: t.maybe(t.String),
  number: t.maybe(t.String),
  city: t.maybe(t.String),
  postalCode: t.maybe(t.String)
}, 'SimpleAddress')

export const SimplePhoneNumber = t.struct(
  {
    number: t.String,
    note: t.String
  },
  {
    name: 'SimplePhoneNumber'
  }
)

export const Address = t.struct(
  {
    type: t.maybe(t.String),
    street: t.String,
    number: t.union([t.Number, t.String]),
    fullAddress: t.maybe(t.String),
    registerNumber: t.maybe(t.Number),
    postalCode: t.maybe(PostalCode),
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
