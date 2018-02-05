import t from 'tcomb';

t.PostalCode = t.struct(
  {
    number: t.maybe(t.Number),
    verified: t.Boolean
  },
  {
    name: 'PostalCode',
    defaultProps: {
      verified: false
    }
  }
);

t.SimpleAddress = t.struct({
  fullAddress: t.String,
  city: t.String
}, 'SimpleAddress');

t.SimplePhoneNumber = t.struct(
  {
    number: t.String,
    note: t.String
  },
  {
    name: 'SimplePhoneNumber'
  }
);

/**
 * @swagger
 * definitions:
 *   TypedContactInfo:
 *     properties:
 *       type:
 *         type: string
 *       value:
 *         type: string
 *       note:
 *         type: string
 */
t.TypedContactInfo = t.struct(
  {
    type: t.TypeContact,
    value: t.String,
    note: t.maybe(t.String)
  },
  {
    name: 'TypedContactInfo',
    type: 'TELEFONO'
  }
);

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
    zone: t.String
  },
  {
    name: 'Address'
  }
);
