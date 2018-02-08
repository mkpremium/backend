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

t.TypedContactInfoStatus = t.enums({
  UNDEFINED: 'UNDEFINED',
  GOOD: 'GOOD',
  BAD: 'BAD'
});

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
    note: t.maybe(t.String),
    status: t.TypedContactInfoStatus
  },
  {
    name: 'TypedContactInfo',
    defaultProps: {
      type: 'TELEFONO',
      status: 'UNDEFINED'
    }
  }
);

/**
 * @swagger
 * definitions:
 *   ContactValue:
 *     properties:
 *       value:
 *         type: string
 */
t.ContactValue = t.struct(
  {
    value: t.maybe(t.String)
  }
);

t.TypedContactInfoUpdate = t.struct(
  {
    type: t.TypeContact,
    value: t.maybe(t.String),
    note: t.maybe(t.String),
    status: t.TypedContactInfoStatus
  },
  {
    name: 'TypedContactInfo',
    defaultProps: {
      type: 'TELEFONO',
      status: 'UNDEFINED'
    }
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
